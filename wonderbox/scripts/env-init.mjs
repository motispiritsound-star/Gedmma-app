#!/usr/bin/env node
// Copies .env.example to apps/web/.env unless one already exists.
// The web app and Prisma both read apps/web/.env; keeping a single real file
// there avoids two sources of truth drifting apart.
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '.env.example');
const target = resolve(root, 'apps/web/.env');

if (existsSync(target)) {
  console.log('apps/web/.env already exists — leaving it alone.');
  process.exit(0);
}
copyFileSync(source, target);
console.log('Created apps/web/.env from .env.example.');
