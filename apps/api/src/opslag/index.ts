/**
 * Objectopslag achter een adapter.
 *
 * De lokale driver schrijft naar de schijf en is bedoeld voor ontwikkeling en
 * kleine installaties; de S3-driver is voor productie. Documenten worden altijd
 * onder een gegenereerde sleutel opgeslagen, nooit onder de naam die de
 * gebruiker aanleverde: dat sluit path traversal uit.
 */
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { config } from '../config.ts';
import { ApiFout } from '../http/fout.ts';

export type OpgeslagenBestand = {
  sleutel: string;
  grootte: number;
  sha256: string;
};

export type Opslag = {
  bewaar(administratieId: string, inhoud: Buffer, mime: string): Promise<OpgeslagenBestand>;
  lees(sleutel: string): Promise<Buffer>;
  verwijder(sleutel: string): Promise<void>;
};

/** Toegestane bestandstypen met hun magic bytes. Alles daarbuiten wordt geweigerd. */
const TOEGESTAAN: { mime: string; extensie: string; magisch: (buffer: Buffer) => boolean }[] = [
  { mime: 'application/pdf', extensie: 'pdf', magisch: (b) => b.subarray(0, 4).toString('latin1') === '%PDF' },
  { mime: 'image/jpeg', extensie: 'jpg', magisch: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', extensie: 'png', magisch: (b) => b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' },
  { mime: 'image/webp', extensie: 'webp', magisch: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'image/heic', extensie: 'heic', magisch: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp' },
  { mime: 'text/csv', extensie: 'csv', magisch: () => true },
  { mime: 'text/plain', extensie: 'txt', magisch: () => true },
  { mime: 'application/xml', extensie: 'xml', magisch: (b) => b.subarray(0, 5).toString('latin1').trimStart().startsWith('<') },
  { mime: 'text/xml', extensie: 'xml', magisch: (b) => b.subarray(0, 5).toString('latin1').trimStart().startsWith('<') },
];

/**
 * Controleert of het opgegeven type klopt met de werkelijke inhoud. Een bestand
 * dat zegt een pdf te zijn maar het niet is, wordt geweigerd — een van de
 * goedkoopste manieren om uploadmisbruik tegen te gaan.
 */
export function controleerBestand(inhoud: Buffer, mime: string): { extensie: string } {
  if (inhoud.length === 0) {
    throw new ApiFout('validation_failed', 'Het bestand is leeg.', 'Kies een bestand met inhoud.');
  }
  if (inhoud.length > config.opslag.maxBestandBytes) {
    throw new ApiFout(
      'payload_too_large',
      `Het bestand is groter dan ${Math.round(config.opslag.maxBestandBytes / 1_000_000)} MB.`,
      'Maak de scan kleiner of splits het document.',
    );
  }
  const toegestaan = TOEGESTAAN.find((t) => t.mime === mime.split(';')[0]?.trim());
  if (!toegestaan) {
    throw new ApiFout(
      'unsupported_media_type',
      `Bestanden van het type ${mime} worden niet geaccepteerd.`,
      'Upload een pdf, jpg, png, webp, heic, csv of xml.',
    );
  }
  if (!toegestaan.magisch(inhoud)) {
    throw new ApiFout(
      'validation_failed',
      'De inhoud van het bestand komt niet overeen met het opgegeven type.',
      'Sla het bestand opnieuw op in het juiste formaat en probeer het nog eens.',
    );
  }
  return { extensie: toegestaan.extensie };
}

class LokaleOpslag implements Opslag {
  #basis: string;

  constructor(basis: string) {
    this.#basis = resolve(basis);
  }

  #pad(sleutel: string): string {
    const volledig = resolve(join(this.#basis, sleutel));
    if (!volledig.startsWith(this.#basis)) {
      throw new Error('Opslagsleutel wijst buiten de opslagmap.');
    }
    return volledig;
  }

  async bewaar(administratieId: string, inhoud: Buffer, mime: string): Promise<OpgeslagenBestand> {
    const { extensie } = controleerBestand(inhoud, mime);
    const sleutel = `${administratieId}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extensie}`;
    const pad = this.#pad(sleutel);
    await mkdir(dirname(pad), { recursive: true });
    await writeFile(pad, inhoud);
    return { sleutel, grootte: inhoud.length, sha256: createHash('sha256').update(inhoud).digest('hex') };
  }

  async lees(sleutel: string): Promise<Buffer> {
    return readFile(this.#pad(sleutel));
  }

  async verwijder(sleutel: string): Promise<void> {
    await unlink(this.#pad(sleutel)).catch(() => undefined);
  }
}

let opslagInstantie: Opslag | null = null;

export function opslag(): Opslag {
  if (opslagInstantie) return opslagInstantie;
  if (config.opslag.driver === 's3') {
    // De S3-driver hoort bij fase 3; hij wordt bewust niet als werkend
    // gepresenteerd zolang hij er niet is. Zie docs/roadmap.md.
    throw new Error(
      'De S3-driver is nog niet beschikbaar. Zet STORAGE_DRIVER=lokaal of implementeer de driver in apps/api/src/opslag/s3.ts.',
    );
  }
  opslagInstantie = new LokaleOpslag(config.opslag.lokaleMap);
  return opslagInstantie;
}

/** Alleen voor tests: een opslag in het geheugen. */
export function gebruikGeheugenopslag(): Map<string, Buffer> {
  const bestanden = new Map<string, Buffer>();
  opslagInstantie = {
    async bewaar(administratieId, inhoud, mime) {
      const { extensie } = controleerBestand(inhoud, mime);
      const sleutel = `${administratieId}/${randomUUID()}.${extensie}`;
      bestanden.set(sleutel, inhoud);
      return { sleutel, grootte: inhoud.length, sha256: createHash('sha256').update(inhoud).digest('hex') };
    },
    async lees(sleutel) {
      const inhoud = bestanden.get(sleutel);
      if (!inhoud) throw new Error(`Bestand ${sleutel} bestaat niet.`);
      return inhoud;
    },
    async verwijder(sleutel) {
      bestanden.delete(sleutel);
    },
  };
  return bestanden;
}
