import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const ENV_FILE_PATH = path.resolve(currentDir, "../../.env");

dotenv.config({ path: ENV_FILE_PATH, quiet: true });

export const REQUIRED_ENV_VARS = [
  "NODE_ENV",
  "PORT",
  "APP_PROTOCOL",
  "APP_BASE_URL",
  "DATABASE_URL",
  "JWT_SECRET",
  "PEPPER_SECRET",
  "ENCRYPTION_KEY",
  "BLIND_INDEX_KEY",
  "ALLOWED_ORIGIN",
];

function readKeysDeclaredInEnvFile() {
  try {
    return dotenv.parse(fs.readFileSync(ENV_FILE_PATH));
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export function collectEnvironmentProblems(requiredVars = REQUIRED_ENV_VARS) {
  const keysInFile = readKeysDeclaredInEnvFile();
  const problems = [];

  for (const name of requiredVars) {
    const value = process.env[name];
    const hasUsableValue = value !== undefined && value !== "";

    if (hasUsableValue) {
      continue;
    }

    const keyIsDeclaredInFile = Object.prototype.hasOwnProperty.call(
      keysInFile,
      name,
    );

    if (keyIsDeclaredInFile) {
      problems.push(`"${name}" is defined but has no value set.`);
    } else {
      problems.push(`"${name}" is not defined in .env.`);
    }
  }

  return problems;
}

export function validateEnvironment() {
  const problems = collectEnvironmentProblems();

  if (problems.length === 0) {
    return;
  }

  console.error("");
  console.error("Environment check failed — the server will not start.");
  console.error("");
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error("");
  console.error(`Fix the values in ${ENV_FILE_PATH} and try again.`);
  console.error("");

  process.exit(1);
}
