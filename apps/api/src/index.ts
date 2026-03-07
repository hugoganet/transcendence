import { app } from "./app.js";
import { prisma, prismaPool } from "./config/database.js";
import { disconnectRedis } from "./config/redis.js";

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down...`);
  disconnectRedis()
    .then(() => prisma.$disconnect())
    .then(() => prismaPool.end())
    .then(() => {
      console.log("All connections closed.");
      process.exit(0);
    });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
