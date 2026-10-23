import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { SYSTEM_STATUSES } from "../src/constant/case-status.js";

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
