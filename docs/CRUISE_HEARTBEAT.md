# CRUISE_HEARTBEAT.md — dual-worker handshake

> Collision guard between the two cruise workers (see [CRUISE_MODE.md](CRUISE_MODE.md) → Workers).
> **Append one line per tick**, never rewrite history. Format:
> `<worker> · <UTC, from: date -u> · starting <item>`
> where `<worker>` is `finance-cron` or `finance-session`.
>
> **Rule:** before acting, read the LAST line. If it was stamped **<35 min ago by the OTHER worker**,
> STOP this tick (the other loop is alive). Otherwise append your stamp and proceed. Push the stamp
> only when `origin/main == HEAD` (push-safety); otherwise it stays local and the pull/yield logic
> still protects the in-session worker.

---
finance-session · 2026-06-25T22:00:00Z · seed line (infra created; no tick run yet)
finance-session · 2026-06-25T23:26:47Z · starting: ordered-map step 2 (competitor + feature-gap scan) — supervised test tick

finance-cron · 2026-06-25T23:25:44Z · starting tick (ordered-map item 1: bugs/correctness scan)
