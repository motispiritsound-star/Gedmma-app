#!/usr/bin/env node
/**
 * `npm run lint` in de root. Draait ESLint over de hele monorepo met de flat
 * config in eslint.config.js. Met `--fix` worden oplosbare meldingen hersteld.
 */
import { spawnSync } from 'node:child_process';
import { repoRoot } from './_workspaces.js';

const fix = process.argv.includes('--fix');
const args = ['eslint', '.', '--max-warnings', '0'];
if (fix) args.push('--fix');

const uitkomst = spawnSync('npx', args, { cwd: repoRoot, stdio: 'inherit', env: process.env });
process.exit(uitkomst.status ?? 1);
