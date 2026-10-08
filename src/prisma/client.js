import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";
import { CREDENTIALS } from "../constant/credentials.js";

if (!CREDENTIALS.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const pool = new Pool({ connectionString: CREDENTIALS.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  omit: { user: { password: true, aadhaar_hash: true } },
});

const PROBE_ATTEMPTS = 3;
const PROBE_BACKOFF_MS = 1000;

// SQLSTATEs that mean the configuration itself is wrong, so retrying cannot
// help. XX000 is nominally "internal_error", but Supabase's pooler (Supavisor)
// returns it for "tenant/user postgres.<ref> not found" — a DATABASE_URL whose
// project ref doesn't match a live project.
const FATAL_SQL_STATES = new Set([
  "28000", // invalid_authorization_specification
  "28P01", // invalid_password
  "3D000", // database does not exist
  "XX000", // Supavisor: unknown tenant / wrong project ref
]);

const PRISMA_CODE = /^P\d{4}$/; // Prisma's own codes (P2010, ...)
const SQL_STATE = /^[0-9A-Z]{5}$/; // Postgres SQLSTATE (XX000, 28P01, ...)

// Prisma wraps the driver's error, so the SQLSTATE is buried: a query failure
// arrives as PrismaClientKnownRequestError (`code: "P2010"`) with the real
// state under `meta.driverAdapterError.cause`, while a connection-level failure
// surfaces the DriverAdapterError directly with it under `cause`. This walks
// both shapes, skipping Prisma's P#### codes — they're 5 chars too, so a naive
// check reports "P2010" and misses the actual cause.
export const sqlState = (error, depth = 0) => {
  if (!error || typeof error !== "object" || depth > 5) return null;

  for (const value of [error.originalCode, error.code]) {
    if (
      typeof value === "string" &&
      SQL_STATE.test(value) &&
      !PRISMA_CODE.test(value)
    ) {
      return value;
    }
  }

  return (
    sqlState(error.cause, depth + 1) ??
    sqlState(error.meta?.driverAdapterError, depth + 1)
  );
};

// Password-free rendering of the target, so a failure says which database was
// actually dialled without putting the credential in the logs.
const describeTarget = () => {
  try {
    const url = new URL(CREDENTIALS.DATABASE_URL);
    return `${url.username}@${url.hostname}:${url.port || 5432}${url.pathname}`;
  } catch {
    return "unparseable DATABASE_URL";
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// `$connect()` proves nothing with a driver adapter: it resolves even against a
// wrong host or a dead project, because `pg` only dials on the first real
// query. Without this probe the container boots "successfully" and the bad
// config surfaces as a 500 on whichever request happens to arrive first.
const verifyDatabaseConnection = async () => {
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      const state = sqlState(error);

      if ((state && FATAL_SQL_STATES.has(state)) || attempt >= PROBE_ATTEMPTS) {
        if (state === "XX000") {
          console.error(
            "The Supabase pooler rejected the tenant. The project ref in " +
              "DATABASE_URL's username (postgres.<ref>) does not match a live " +
              "project — check the connection string in this environment's " +
              "variables, and that the pooler host's region matches the project.",
          );
        }
        throw error;
      }

      console.warn(
        `Database probe ${attempt}/${PROBE_ATTEMPTS} failed, retrying in ${PROBE_BACKOFF_MS}ms...`,
      );
      await sleep(PROBE_BACKOFF_MS);
    }
  }
};

try {
  await prisma.$connect();
  await verifyDatabaseConnection();
  console.log("Database connected successfully");
} catch (error) {
  const state = sqlState(error);
  console.error(
    `Database connection failed (${describeTarget()}${state ? `, SQLSTATE ${state}` : ""}):`,
    error,
  );
  process.exit(1);
}

export default prisma;
