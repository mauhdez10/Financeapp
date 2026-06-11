// api/_sanitize.js — THE one client-data security boundary (MD-C, v0.76).
// Shared by resolve-portal.js (token portal) and linked-overview.js (account links).
// Only these top-level fields ever reach a browser that isn't the advisor's.
// Everything else (social/p1Social/p2Social, dob/p1Dob/p2Dob, phone/p1Phone, address,
// recommendedBy, advisor-internal notes, etc.) is dropped.
const ALLOW = new Set([
  "id", "firstName", "lastName", "partnerFirst", "partnerLast", "clientType",
  "email", "incomeStreams", "bills", "cards", "accounts", "loans",
  "customAssets", "marketInvestments", "properties", "monthSnapshots",
  "alloc", "committed", "efMonths", "savedPortfolio", "portfolioCustom",
  "planStrategy", "planOverrides", "reportInclude"
]);

function sanitizeClient(data) {
  const safe = {};
  if (!data || typeof data !== "object") return safe;
  for (const k of Object.keys(data)) {
    if (ALLOW.has(k)) safe[k] = data[k];
  }
  // Goals are client-facing; advisor-internal notes (general, setbacks) are not.
  if (data.notes && typeof data.notes === "object") {
    safe.notes = {
      goals:     data.notes.goals     || "",
      shortTerm: data.notes.shortTerm || "",
      midTerm:   data.notes.midTerm   || "",
      longTerm:  data.notes.longTerm  || ""
    };
  }
  return safe;
}

export { ALLOW, sanitizeClient };
