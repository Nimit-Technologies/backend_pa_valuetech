import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
 
  adapter,
});

try {
  await prisma.$connect();
  console.log(`Database connected successfully`);
} catch (error) {
  console.error("Database connection failed:", error);
  process.exit(1);
}

export default prisma;
