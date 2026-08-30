#!/usr/bin/env node
/**
 * `npm run dev` — start alles wat je nodig hebt met een commando.
 *
 * Controleert de database, draait de migraties en de seed, en start daarna de
 * API en de webapp naast elkaar. Bij Ctrl+C gaan beide netjes uit.
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import net from 'node:net';
import { repoRoot } from './_workspaces.js';

const ESC = String.fromCharCode(27);
const kleuren = { api: `${ESC}[36m`, web: `${ESC}[35m`, uit: `${ESC}[0m` };

function meld(bericht) {
  process.stdout.write(`${bericht}\n`);
}

/** Leest DATABASE_URL uit .env of uit de omgeving. */
function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPad = join(repoRoot, '.env');
  if (existsSync(envPad)) {
    const match = /^DATABASE_URL\s*=\s*(.+)$/m.exec(readFileSync(envPad, 'utf8'));
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return 'postgres://gedmma_app:gedmma_dev@127.0.0.1:5432/gedmma';
}

function bereikbaar(host, poort) {
  return new Promise((resolve) => {
    const verbinding = net.connect({ host, port: poort });
    const klaar = (uitkomst) => {
      verbinding.destroy();
      resolve(uitkomst);
    };
    verbinding.setTimeout(1500);
    verbinding.on('connect', () => klaar(true));
    verbinding.on('error', () => klaar(false));
    verbinding.on('timeout', () => klaar(false));
  });
}

const url = new URL(databaseUrl());
const host = url.hostname || '127.0.0.1';
const poort = Number(url.port || 5432);

if (!existsSync(join(repoRoot, '.env')) && existsSync(join(repoRoot, '.env.example'))) {
  copyFileSync(join(repoRoot, '.env.example'), join(repoRoot, '.env'));
  meld('Er is een .env aangemaakt op basis van .env.example. Pas hem aan voordat je naar productie gaat.');
}

meld(`Database controleren op ${host}:${poort} ...`);
if (!(await bereikbaar(host, poort))) {
  meld('');
  meld(`De database op ${host}:${poort} is niet bereikbaar.`);
  meld('');
  meld('Start PostgreSQL op een van deze manieren:');
  meld('  docker compose up -d db          (als je Docker hebt)');
  meld('  sudo pg_ctlcluster 16 main start (als PostgreSQL lokaal is geinstalleerd)');
  meld('');
  meld('Zie docs/deployment.md voor het aanmaken van de rollen en de database.');
  process.exit(1);
}

meld('Migraties uitvoeren ...');
const migratie = spawnSync('npm', ['run', '--silent', '-w', '@gedmma/api', 'migrate'], {
  cwd: repoRoot,
  stdio: 'inherit',
});
if (migratie.status !== 0) process.exit(migratie.status ?? 1);

meld('Basisgegevens klaarzetten ...');
const seed = spawnSync('npm', ['run', '--silent', '-w', '@gedmma/api', 'seed'], {
  cwd: repoRoot,
  stdio: 'inherit',
});
if (seed.status !== 0) process.exit(seed.status ?? 1);

const processen = [];

function start(naam, argumenten) {
  const kind = spawn('npm', argumenten, { cwd: repoRoot, env: process.env });
  const voorvoegsel = `${kleuren[naam] ?? ''}[${naam}]${kleuren.uit} `;

  for (const stroom of [kind.stdout, kind.stderr]) {
    stroom.setEncoding('utf8');
    let rest = '';
    stroom.on('data', (stuk) => {
      const regels = (rest + stuk).split('\n');
      rest = regels.pop() ?? '';
      for (const regel of regels) process.stdout.write(`${voorvoegsel}${regel}\n`);
    });
  }

  kind.on('exit', (code) => {
    meld(`${voorvoegsel}gestopt (code ${code})`);
    stopAlles(code ?? 0);
  });

  processen.push(kind);
  return kind;
}

let aanHetStoppen = false;
function stopAlles(code) {
  if (aanHetStoppen) return;
  aanHetStoppen = true;
  for (const kind of processen) kind.kill('SIGTERM');
  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => stopAlles(0));
process.on('SIGTERM', () => stopAlles(0));

meld('');
meld('Gedmma start op:');
meld('  API      http://localhost:4000/health/ready');
meld('  Webapp   http://localhost:5173');
meld('');

start('api', ['run', '--silent', '-w', '@gedmma/api', 'dev']);
start('web', ['run', '--silent', '-w', '@gedmma/web', 'dev']);
