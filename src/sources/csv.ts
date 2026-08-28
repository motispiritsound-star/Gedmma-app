import { readFile } from 'node:fs/promises';
import { parseCsv } from '../util/csv.ts';
import { normalizeUrl, registrableDomain, isPlatformPage } from '../util/url.ts';
import { herkenRechtsvorm } from '../db/contact.ts';
import type { CompanyInput, Source, SourceOptions } from './types.ts';

const pick = (row: Record<string, string>, ...keys: string[]): string =>
  keys.map((key) => row[key]).find((value) => value && value.trim() !== '')?.trim() ?? '';

/**
 * Leest een eigen bedrijvenlijst in. Herkent gangbare kolomnamen in NL en EN,
 * zoals: naam/bedrijfsnaam/company, website/url/site, plaats/stad/city.
 */
export const csvSource: Source = {
  name: 'csv',
  description: 'Eigen CSV-bestand met bedrijven (kolommen: naam, website, plaats, ...)',

  async fetch({ file, limit }: SourceOptions): Promise<CompanyInput[]> {
    if (!file) throw new Error('csv-bron vereist --file pad/naar/bestand.csv');
    const rows = parseCsv(await readFile(file, 'utf8'));
    const out: CompanyInput[] = [];

    for (const row of rows) {
      const rawSite = pick(row, 'website', 'url', 'site', 'webadres', 'homepage');
      const website = normalizeUrl(rawSite);
      const domain = registrableDomain(rawSite);
      if (!website || !domain) continue;
      if (isPlatformPage(website)) continue;

      const naam = pick(row, 'naam', 'bedrijfsnaam', 'handelsnaam', 'company', 'name') || domain;
      out.push({
        name: naam,
        website,
        domain,
        city: pick(row, 'plaats', 'stad', 'vestigingsplaats', 'city') || null,
        province: pick(row, 'provincie', 'province') || null,
        branch: pick(row, 'branche', 'sbi', 'categorie', 'category') || null,
        kvkNumber: pick(row, 'kvk', 'kvknummer', 'kvk_nummer') || null,
        phone: pick(row, 'telefoon', 'tel', 'phone') || null,
        email: pick(row, 'email', 'e-mail', 'mail') || null,
        // De rechtsvorm bepaalt of je mag bellen; uit de kolom, anders uit de naam.
        rechtsvorm: herkenRechtsvorm(pick(row, 'rechtsvorm', 'legal_form')) ?? herkenRechtsvorm(naam),
        source: 'csv',
        sourceRef: file,
      });
      if (limit && out.length >= limit) break;
    }
    return out;
  },
};
