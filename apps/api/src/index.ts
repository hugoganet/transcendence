import { createServer } from "node:http";
import { app, registerRoutes } from "./app.js";
import { prisma, prismaPool } from "./config/database.js";
import { disconnectRedis } from "./config/redis.js";
import { sessionRedisClient, disconnectSessionRedis, sessionMiddleware } from "./config/session.js";
import { createSocketServer } from "./socket/index.js";

// Register routes with session middleware injected between rate limiter and routes
registerRoutes(sessionMiddleware);

const httpServer = createServer(app);
const io = createSocketServer(httpServer, sessionMiddleware);

export { io };

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down...`);
  // Close HTTP server first (stops accepting new connections), then Socket.IO (closes adapter + pub/sub clients)
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

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
