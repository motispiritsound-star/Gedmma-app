#!/usr/bin/env node
/** `npm test` in de root: draait de tests van elk pakket dat ze heeft. */
import { draaiOveralen } from './run-script.js';
process.exit(draaiOveralen('test'));
