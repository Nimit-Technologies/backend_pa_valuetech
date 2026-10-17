import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { SYSTEM_STATUSES } from "../src/constant/case-status.js";

// Seeds the ten system statuses. A super admin may add more through the API and
// may rename these, but they must exist with the right `code` and `is_terminal`
// or the case lifecycle has no starting point and the terminal freeze silently
// stops applying.
//
// Idempotent: keyed on `code`, so re-running is safe. An existing row keeps its
// edited `name` and `sort_order` — only `is_terminal` is re-asserted, because a
// wrong value there fails silently rather than loudly.

// A standalone client rather than src/prisma/client.js: that module connects and
// calls process.exit as an import side effect, which a script should own itself.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const seedStatuses = async () => {
  for (const {
    code,
    name,
    sort_order,
    is_terminal = false,
  } of SYSTEM_STATUSES) {
    await prisma.status.upsert({
      where: { code },
      update: { is_terminal },
      create: { code, name, sort_order, is_terminal },
    });
  }

  console.log(`Seeded ${SYSTEM_STATUSES.length} system statuses`);
};

const main = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check your .env file.");
  }

  await seedStatuses();
};

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
