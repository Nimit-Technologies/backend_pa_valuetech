import app from "./src/app.js";
import prisma from "./src/prisma/client.js";
import { CREDENTIALS } from "./src/constant/credentials.js";

const REQUIRED_ENV_VARS = [
  "APP_PROTOCOL",
  "APPLICATION_BASE_URL",
  "PORT",
  // Without this, the server boots fine and only fails per-request, inside
  // login's try/catch, the first time someone actually signs in — a
  // misconfiguration that would otherwise stay silent until then.
  "JWT_SECRET",
];

function assertRequiredEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !CREDENTIALS[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}. Check your .env file.`,
    );
    process.exit(1);
  }

  const port = Number(CREDENTIALS.PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error(
      `Invalid PORT "${CREDENTIALS.PORT}" — must be an integer between 1 and 65535.`,
    );
    process.exit(1);
  }

  return port;
}

const PORT = assertRequiredEnv();

let server;
let shuttingDown = false;

function shutdown(signal) {
  return async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received: shutting down gracefully...`);

    try {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        });
      }
      await prisma.$disconnect();
      console.log("Shutdown complete.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };
}

process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));

// Last-resort safety nets: without these, an unawaited rejected promise or a
// thrown error outside Express's request cycle crashes the process with a
// raw, unlogged stack trace (or, for unhandledRejection, keeps running in an
// unknown state). Fail fast and loud instead.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

server = app.listen(PORT, () => {
  console.log(
    `Server running on url ${CREDENTIALS.APP_PROTOCOL}://${CREDENTIALS.APPLICATION_BASE_URL}:${PORT}`,
  );
});

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  switch (error.code) {
    case "EACCES":
      console.error(`Port ${PORT} requires elevated privileges.`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`Port ${PORT} is already in use.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
