/**
 * Geen hardcoded gebruikersteksten in componenten, en de app schakelt echt van
 * taal. Dat laatste is makkelijk stuk te maken en moeilijk te zien.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { TALEN, vertaal, nl } from '@gedmma/i18n';

function alleBronbestanden(map: string): string[] {
  const uitkomst: string[] = [];
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) uitkomst.push(...alleBronbestanden(pad));
    else if (/\.tsx?$/.test(naam)) uitkomst.push(pad);
  }
  return uitkomst;
}

describe('meertaligheid', () => {
  test('alle vier de talen leveren tekst voor elke sleutel', () => {
    for (const { code } of TALEN) {
      for (const sleutel of Object.keys(nl) as (keyof typeof nl)[]) {
        expect(vertaal(code, sleutel), `${code}/${String(sleutel)}`).not.toBe(String(sleutel));
      }
    }
  });

  test('elke gebruikte vertaalsleutel bestaat', () => {
    const bestanden = alleBronbestanden(join(process.cwd(), 'src'));
    const patroon = /\bt\(\s*'([a-z][\w.]*)'/g;
    const onbekend = new Set<string>();

    for (const bestand of bestanden) {
      const inhoud = readFileSync(bestand, 'utf8');
      let match: RegExpExecArray | null;
      while ((match = patroon.exec(inhoud)) !== null) {
        const sleutel = match[1]!;
        if (!(sleutel in nl)) onbekend.add(`${sleutel} (${bestand.split('/src/')[1]})`);
      }
    }

    expect([...onbekend]).toEqual([]);
  });

  test('componenten bevatten geen losse Nederlandse zinnen buiten t()', () => {
    // Een grove maar effectieve controle: JSX-tekst van meer dan drie woorden
    // die niet uit een vertaling komt, is bijna altijd een vergeten sleutel.
    const bestanden = alleBronbestanden(join(process.cwd(), 'src', 'ontwerp'));
    for (const bestand of bestanden) {
      const inhoud = readFileSync(bestand, 'utf8');
      const jsxTekst = inhoud.match(/>\s*[A-Z][a-z]+(?:\s+[a-z]+){3,}\s*</g) ?? [];
      expect(jsxTekst, `${bestand} bevat vaste tekst`).toEqual([]);
    }
  });
});
