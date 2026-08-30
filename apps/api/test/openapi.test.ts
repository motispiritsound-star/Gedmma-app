/**
 * Contracttest op de OpenAPI-specificatie.
 *
 * De specificatie wordt uit de routers gegenereerd. Wat niet gegenereerd kan
 * worden, is de omschrijving per route. Deze test bewaakt dat die tabel en de
 * werkelijke routes precies gelijk lopen, zodat de documentatie niet stil uit
 * de pas kan gaan lopen met het gedrag.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuweClient, startTestomgeving, stopTestomgeving } from './hulp.ts';
import { koppelingen } from '../src/http/server.ts';
import { bouwOpenApi, inventariseer, omschrijvingen, sleutelVan } from '../src/http/openapi.ts';

before(async () => {
  await startTestomgeving();
});
after(async () => {
  await stopTestomgeving();
});

describe('openapi', () => {
  test('elke route heeft een omschrijving en elke omschrijving een route', () => {
    const eindpunten = inventariseer(koppelingen);
    assert.ok(eindpunten.length > 50, 'de routertabel lijkt leeg te zijn');

    const zonderOmschrijving = eindpunten.map(sleutelVan).filter((sleutel) => !omschrijvingen[sleutel]);
    assert.deepEqual(zonderOmschrijving, [], 'deze routes staan niet in de specificatie');

    const sleutels = new Set(eindpunten.map(sleutelVan));
    const zonderRoute = Object.keys(omschrijvingen).filter((sleutel) => !sleutels.has(sleutel));
    assert.deepEqual(zonderRoute, [], 'deze omschrijvingen wijzen naar routes die niet bestaan');
  });

  test('de specificatie is zonder aanmelding op te vragen en beschrijft alle paden', async () => {
    const client = nieuweClient();
    const antwoord = await client.get('/api/v1/openapi.json');

    assert.equal(antwoord.status, 200);
    assert.equal(antwoord.body.openapi, '3.1.0');
    assert.equal(antwoord.body.info.title, 'Gedmma API');

    const eindpunten = inventariseer(koppelingen);
    for (const eindpunt of eindpunten) {
      const pad = antwoord.body.paths[eindpunt.pad];
      assert.ok(pad, `pad ontbreekt: ${eindpunt.pad}`);
      assert.ok(pad[eindpunt.methode.toLowerCase()], `methode ontbreekt: ${sleutelVan(eindpunt)}`);
    }
  });

  test('routes achter een recht dragen dat recht in de specificatie', () => {
    const doc = bouwOpenApi(koppelingen, '0.0.0-test') as {
      paths: Record<string, Record<string, { 'x-vereist-recht'?: string; security?: unknown[] }>>;
    };

    const boeking =
      doc.paths['/api/v1/administraties/{administratieId}/verkoopfacturen/{id}/definitief']?.post;
    assert.ok(boeking, 'de route om een factuur definitief te maken ontbreekt');
    assert.equal(boeking['x-vereist-recht'], 'journaal.definitief');
    assert.equal(boeking.security, undefined, 'deze route hoort niet openbaar te zijn');

    // Aanmelden zelf kan uiteraard niet achter een aanmelding zitten.
    assert.deepEqual(doc.paths['/api/v1/auth/login']?.post?.security, []);
  });

  test('elk pad met een parameter beschrijft die parameter', () => {
    const doc = bouwOpenApi(koppelingen, '0.0.0-test') as {
      paths: Record<string, { parameters: { name: string }[] }>;
    };

    for (const [pad, inhoud] of Object.entries(doc.paths)) {
      const verwacht = [...pad.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((treffer) => treffer[1]);
      assert.deepEqual(
        inhoud.parameters.map((parameter) => parameter.name),
        verwacht,
        `parameters kloppen niet voor ${pad}`,
      );
    }
  });
});
