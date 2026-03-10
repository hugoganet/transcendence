/**
 * Global setup for integration tests.
 * Runs once before all test files — creates the test DB (if needed),
 * applies migrations, and verifies connectivity.
 * Runs once after all test files — disconnects the migration client.
 */
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, "../..");

async function ensureTestDatabase(testDbUrl: string): Promise<void> {
  // Parse the test DB URL to extract the database name and build an admin URL
  const url = new URL(testDbUrl);
  const testDbName = url.pathname.slice(1); // remove leading "/"
  url.pathname = "/postgres"; // connect to default DB to run CREATE DATABASE

  const adminPool = new pg.Pool({ connectionString: url.toString(), max: 1 });
  try {
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [testDbName],
    );
    if (result.rowCount === 0) {
      // Safe: testDbName is derived from our own config, not user input
      await adminPool.query(`CREATE DATABASE "${testDbName}"`);
      console.log(`Created test database: ${testDbName}`);
    }
  } finally {
    await adminPool.end();
  }
}

export async function setup() {
  const testDbUrl =
    process.env.DATABASE_URL_TEST ??
    "postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test";

  // Create the test database if it doesn't exist
  await ensureTestDatabase(testDbUrl);

  // Apply migrations to the test database
  execSync("npx prisma migrate deploy", {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: "pipe",
  });
}

export async function teardown() {
  // Nothing to tear down — the test DB persists for speed.
  // Individual test suites truncate tables via resetDatabase().
}
