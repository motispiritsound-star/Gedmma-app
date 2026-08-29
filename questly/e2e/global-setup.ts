import { execFileSync } from "node:child_process";
import { config } from "dotenv";

/** Migrates and seeds the dedicated end-to-end database before the suite runs. */
export default function globalSetup() {
  config({ path: ".env.e2e", override: true });
  const options = { stdio: "inherit" as const, env: process.env };
  execFileSync("npx", ["prisma", "migrate", "deploy"], options);
  execFileSync("npx", ["tsx", "prisma/seed.ts"], options);
}
