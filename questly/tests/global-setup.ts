import { execFileSync } from "node:child_process";
import { config } from "dotenv";

/**
 * Runs once per `vitest run`: migrate and seed the dedicated test database.
 * Tests never touch the development database.
 */
export default function globalSetup() {
  config({ path: ".env.test", override: true });
  const options = { stdio: "pipe" as const, env: process.env };
  execFileSync("npx", ["prisma", "migrate", "deploy"], options);
  execFileSync("npx", ["tsx", "prisma/seed.ts"], options);
}
