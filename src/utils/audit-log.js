// Minimal structured audit logging for authentication events (CWE-778 /
// OWASP A09:2021 — Security Logging and Monitoring Failures). No log
// aggregator is wired up yet, but emitting a single-line JSON object per
// event — instead of a free-text console.log — means these can be grepped
// or ingested by one later without changing every call site.
//
// Never pass a password or raw token into `details` — identifiers and
// outcome only.
export const logAuthEvent = (event, details = {}) => {
  console.log(
    JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
};
