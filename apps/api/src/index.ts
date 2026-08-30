#!/usr/bin/env node
/**
 * Startpunt van de API. Draait migraties en seed voordat hij luistert, zodat een
 * verse omgeving met een commando werkt.
 */
import { config } from './config.ts';
import { log } from './util/log.ts';
import { migreer } from './db/migreer.ts';
import { seedBasisgegevens } from './db/seed.ts';
import { maakApp } from './http/server.ts';
import { sluitDb } from './db/pool.ts';
import { startTaakverwerker } from './jobs/verwerker.ts';

const gedraaid = await migreer({ stil: true });
if (gedraaid.length > 0) log.info('Migraties uitgevoerd bij het starten', { aantal: gedraaid.length });
await seedBasisgegevens();

const app = maakApp();
const server = app.listen(config.poort, () => {
  log.info('Gedmma API luistert', { poort: config.poort, omgeving: config.omgeving });
});

const stopTaken = startTaakverwerker();

async function stop(signaal: string): Promise<void> {
  log.info('Afsluiten', { signaal });
  stopTaken();
  server.close();
  await sluitDb();
  process.exit(0);
}

process.on('SIGTERM', () => void stop('SIGTERM'));
process.on('SIGINT', () => void stop('SIGINT'));
