import prisma, { sqlState } from "../prisma/client.js";

// /health is public and the container healthcheck polls it every 30s, so the
// verdict is cached briefly: a burst of requests costs one `SELECT 1` rather
// than one each, and nobody can turn the endpoint into a query amplifier.
const CACHE_MS = 5000;

// Shorter than the healthcheck's own 5s timeout in docker-compose.yaml, so a
// hung database reports "down" instead of letting the probe time out first.
const PROBE_TIMEOUT_MS = 2000;

let cached = null;
let inflight = null;

const withTimeout = async (promise, ms) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`database probe timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    // Without this the pending timer holds the event loop open, delaying
    // shutdown by up to PROBE_TIMEOUT_MS on every SIGTERM.
    clearTimeout(timer);
  }
};

const probe = async () => {
  const query = prisma.$queryRaw`SELECT 1`;

  // When the timeout wins the race this query can still reject afterwards.
  // server.js exits the process on an unhandled rejection, so a slow database
  // would otherwise take the server down via its own health check.
  query.catch(() => {});

  try {
    await withTimeout(query, PROBE_TIMEOUT_MS);
    return { ok: true, error: null, code: null };
  } catch (error) {
    console.error("database health probe failed:", error);
    return {
      ok: false,
      error: error?.message ?? "unknown error",
      code: sqlState(error),
    };
  }
};

/**
 * Reports whether the database answers a trivial read right now.
 *
 * Never rejects — a failure is returned as `{ ok: false }` so callers can
 * report it without a try/catch.
 *
 * @returns {Promise<{ok: boolean, error: string|null, code: string|null, checkedAt: number}>}
 */
export const getDatabaseHealth = async () => {
  if (cached && Date.now() - cached.checkedAt < CACHE_MS) return cached;
  // Concurrent callers during a probe share its result instead of each opening
  // their own, which matters most when the database is slow.
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      cached = { ...(await probe()), checkedAt: Date.now() };
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};
