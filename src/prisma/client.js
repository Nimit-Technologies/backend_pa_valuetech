import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";
import { CREDENTIALS } from "../constant/credentials.js";

if (!CREDENTIALS.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

// `pg` is pinned to exactly 8.18.0 in package.json (not ^8.18.0) — do not
// bump it casually. @prisma/adapter-pg@7.8.0's performIO() passes `values`
// to client.query() twice (once in the config object, once as a redundant
// second argument), which pg's concurrent-query deprecation check (added
// 8.19+) flags on every update() that has 2+ included relations — e.g.
// service.update.user.js's include of branch/department/role/address.
// It's just a console warning today (pg 8.18-8.21 has no security fixes in
// between), but pg 9.0 turns it into a hard error. Tracked upstream, both
// still open as of Prisma 7.9.x — a real fix landed only in Prisma 8,
// which is still RC: https://github.com/prisma/prisma/issues/29407 and
// https://github.com/prisma/prisma/issues/29646. Re-test with
// `node --trace-deprecation` against a multi-relation update() before
// unpinning once either issue is closed on a stable release.
const pool = new Pool({ connectionString: CREDENTIALS.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  // Fail-safe default: no query returns the password hash unless it
  // explicitly opts back in (see service.auth.login.js, the one legitimate
  // exception). Without this, protection against leaking the hash depends
  // entirely on every call site remembering its own select/omit.
  omit: { user: { password: true } },
});

try {
  await prisma.$connect();
  console.log(`Database connected successfully`);
} catch (error) {
  console.error("Database connection failed:", error);
  process.exit(1);
}

export default prisma;
