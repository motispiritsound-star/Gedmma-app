/**
 * De grendels rond het legen van een database.
 *
 * Deze test bestaat om een concrete fout te voorkomen die een keer is gemaakt:
 * een testrun die de ontwikkeldatabase leegde omdat de omgevingsvariabelen te
 * laat werden gezet. Sindsdien staat de testomgeving in een eigen bestand dat
 * als eerste wordt geladen, en weigert leegDatabase() elke database die niet
 * herkenbaar een testdatabase is.
 */
import './omgeving.ts';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.ts';
import { leegDatabase } from '../src/db/migreer.ts';

describe('testomgeving', () => {
  test('de tests draaien tegen de testdatabase, niet tegen de ontwikkeldatabase', () => {
    const naam = new URL(config.database.migratieUrl).pathname.replace(/^\//, '');
    assert.match(naam, /test$/, `de tests wijzen naar database "${naam}"`);
    assert.equal(config.isProductie, false);
  });

  test('leegDatabase weigert een database die geen testdatabase is', async () => {
    const echteUrl = config.database.migratieUrl;
    // De configuratie is bevroren bij het laden; daarom wijzen we hier tijdelijk
    // naar een andere naam via de omgeving en laden we de controle opnieuw.
    const gewijzigd = echteUrl.replace(/\/[^/]+$/, '/gedmma_productie_achtig');
    Object.defineProperty(config.database, 'migratieUrl', { value: gewijzigd, configurable: true });

    await assert.rejects(
      () => leegDatabase(),
      /weigert de database "gedmma_productie_achtig" te legen/,
      'een database zonder _test in de naam hoort geweigerd te worden',
    );

    Object.defineProperty(config.database, 'migratieUrl', { value: echteUrl, configurable: true });
  });
});
