import { createServer } from "node:http";
import { app, registerRoutes } from "./app.js";
import { prisma, prismaPool } from "./config/database.js";
import { disconnectRedis } from "./config/redis.js";
import { sessionRedisClient, disconnectSessionRedis, sessionMiddleware } from "./config/session.js";
import { createSocketServer } from "./socket/index.js";
import { initializeContent } from "./utils/contentLoader.js";

// Load and validate curriculum content before anything else (synchronous, blocking)
try {
  initializeContent(["en", "fr"]);
} catch (err) {
  console.error("Failed to initialize curriculum content. Server cannot start.", err);
  process.exit(1);
}

// Register routes with session middleware injected between rate limiter and routes
registerRoutes(sessionMiddleware);

const httpServer = createServer(app);
const io = createSocketServer(httpServer, sessionMiddleware);

export { io };

// Graceful Shutdown Chain (Epic 1 — finalized in Story 1.4 review)
// Order matters — close consumers before backends:
//   1. httpServer.close()       — stop accepting new HTTP connections
//   2. io.close()               — close Socket.IO server + its internal ioredis pub/sub clients
//   3. disconnectSessionRedis() — close node-redis session store client
//   4. disconnectRedis()        — close ioredis rate limiter client
//   5. prisma.$disconnect()     — close Prisma client
//   6. prismaPool.end()         — close pg connection pool
// When adding new infrastructure (e.g., Resend, Passport), add shutdown here
// AFTER consumers and BEFORE databases.
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down...`);
  httpServer.close(() => {
    io.close()
      .then(() => disconnectSessionRedis())
      .then(() => disconnectRedis())
      .then(() => prisma.$disconnect())
      .then(() => prismaPool.end())
      .then(() => {
        console.log("All connections closed.");
        process.exit(0);
      });
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const PORT = process.env.PORT ?? 3000;

// Connect session Redis client before starting server
await sessionRedisClient.connect();

httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
