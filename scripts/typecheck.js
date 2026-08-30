#!/usr/bin/env node
/** `npm run typecheck` in de root: TypeScript strict-check over alle pakketten. */
import { draaiOveralen } from './run-script.js';
process.exit(draaiOveralen('typecheck', { doorgaanBijFout: true }));
