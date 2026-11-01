// Rebuilds the browser-test database: migrate, then seed the catalog, sample zones, and test accounts.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

export default function setup() {
  rmSync("e2e.db", { force: true });
  const env = { ...process.env, DATABASE_URL: "file:./e2e.db" };
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
}
