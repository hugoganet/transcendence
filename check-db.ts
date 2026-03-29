import { PrismaClient } from './apps/api/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
  try {
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
