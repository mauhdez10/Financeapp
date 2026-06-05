// api/_ratelimit.js
// ============================================================================
// Best-effort distributed rate limiting for the PUBLIC (un-authenticated)
// intake endpoints, keyed by client IP.
//
// FAIL-OPEN by design: if Upstash is not configured (env vars unset), or the
// package fails to load, or the limit call errors, requests are ALLOWED. A
// missing/broken rate-limiter must never take the public intake flow offline.
// Protection activates automatically once the two env vars are set — same
// dry-run philosophy as the email layer.
//
// SETUP (no code change needed to activate):
//   1. Create a free Redis DB at https://console.upstash.com
//   2. Copy its REST URL + REST token
//   3. In Vercel → Financeapp → Settings → Environment Variables, set:
//        UPSTASH_REDIS_REST_URL
//        UPSTASH_REDIS_REST_TOKEN
//   4. Redeploy. The two intake endpoints now rate-limit per IP.
//
// Files starting with "_" are treated by Vercel as non-route helpers (no
// endpoint is created for this file).
// ============================================================================

let _redisPromise;                 // memoized across warm invocations
const _limiters = new Map();       // keyed by "max|window" so endpoints can differ

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length) return String(xff[0]).split(",")[0].trim();
  return (req.headers["x-real-ip"] && String(req.headers["x-real-ip"])) ||
         (req.socket && req.socket.remoteAddress) || "unknown";
}

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;          // not configured → fail open
  try {
    const { Redis } = await import("@upstash/redis");
    return new Redis({ url, token });
  } catch {
    return null;                            // package/init problem → fail open
  }
}

async function getLimiter(max, windowStr) {
  const key = max + "|" + windowStr;
  if (_limiters.has(key)) return _limiters.get(key);
  if (!_redisPromise) _redisPromise = getRedis();
  const redis = await _redisPromise;
  if (!redis) { _limiters.set(key, null); return null; }
  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, windowStr),
      prefix: "ga-intake",
      analytics: false,
    });
    _limiters.set(key, limiter);
    return limiter;
  } catch {
    _limiters.set(key, null);
    return null;
  }
}

/**
 * Check the rate limit for a request.
 * @returns {Promise<{ok:boolean, configured:boolean, remaining?:number, degraded?:boolean}>}
 *   ok=false ONLY when the limiter is configured AND the caller is over the limit.
 *   When unconfigured or on any error, ok=true (fail open).
 */
export async function checkRateLimit(req, bucket, opts) {
  const max = (opts && opts.max) || 8;
  const windowStr = (opts && opts.window) || "10 m";
  let limiter = null;
  try { limiter = await getLimiter(max, windowStr); } catch { limiter = null; }
  if (!limiter) return { ok: true, configured: false };
  try {
    const ip = getClientIp(req);
    const r = await limiter.limit(bucket + ":" + ip);
    return { ok: !!r.success, configured: true, remaining: r.remaining };
  } catch {
    return { ok: true, configured: true, degraded: true };  // runtime error → fail open
  }
}
