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
  // Default: never return the password hash from a `user` query. Individual
  // queries that legitimately need it (e.g. login) opt back in with
  // `omit: { password: false }` at the query level — see
  // features/auth/services/service.auth.login.js.
  omit: {
    user: {
      password: true,
    },
  },
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
