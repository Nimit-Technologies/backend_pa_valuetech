import { validateEnvironment } from "./src/config/env.config.js";
import { CREDENTIALS } from "./src/constant/credentials.js";

validateEnvironment();

const { default: app } = await import("./src/app.js");
const { default: prisma } = await import("./src/prisma/client.js");

function resolvePort() {
  const port = Number(CREDENTIALS?.PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error(
      `Invalid PORT "${CREDENTIALS?.PORT}" — must be an integer between 1 and 65535.`,
    );
    process.exit(1);
  }
  return port;
}

const PORT = resolvePort();

let server;
let shuttingDown = false;

function shutdown(signal) {
  return async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.info(`${signal} received: shutting down gracefully...`);

    try {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        });
      }
      await prisma.$disconnect();
      console.info("Shutdown complete.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };
}

process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

server = app.listen(PORT, () => {
  console.info(
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
