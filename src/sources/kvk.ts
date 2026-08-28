import { config } from '../config.ts';
import { herkenRechtsvorm } from '../db/contact.ts';
import type { CompanyInput, Source, SourceOptions } from './types.ts';

const BASE = 'https://api.kvk.nl/api/v2/zoeken';

type KvkItem = {
  kvkNummer?: string;
  naam?: string;
  adres?: { binnenlandsAdres?: { plaats?: string; straatnaam?: string } };
  type?: string;
};

/**
 * KVK Zoeken API. Let op: de KVK levert géén websites — alleen bedrijfsnaam,
 * KVK-nummer en adres. Deze bron is dus bedoeld om je lijst te verrijken of om
 * bedrijven per plaats te vinden; de website moet uit een andere bron komen
 * (osm of je eigen csv). Rijen zonder website worden overgeslagen bij import.
 */
export const kvkSource: Source = {
  name: 'kvk',
  description: 'KVK Zoeken API (API-key vereist) — bedrijfsnaam/plaats, zonder website',

  async fetch({ area, limit }: SourceOptions): Promise<CompanyInput[]> {
    if (!config.kvkApiKey) {
      throw new Error('Zet KVK_API_KEY in je .env (aanvragen via developers.kvk.nl).');
    }
    if (!area) throw new Error('kvk-bron vereist --area <plaats>');

    const wanted = Math.min(limit ?? 100, 1000);
    const out: CompanyInput[] = [];

    for (let page = 1; out.length < wanted && page <= 10; page++) {
      const url = new URL(BASE);
      url.searchParams.set('plaats', area);
      url.searchParams.set('pagina', String(page));
      url.searchParams.set('resultatenPerPagina', '100');

      const response = await fetch(url, {
        headers: { apikey: config.kvkApiKey, 'user-agent': config.userAgent },
        signal: AbortSignal.timeout(config.timeoutMs),
      });
      if (!response.ok) throw new Error(`KVK API gaf ${response.status} ${response.statusText}`);

      const body = (await response.json()) as { resultaten?: KvkItem[] };
      const items = body.resultaten ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        out.push({
          name: item.naam ?? '',
          website: '',
          domain: '',
          rechtsvorm: herkenRechtsvorm(item.naam),
          city: item.adres?.binnenlandsAdres?.plaats ?? area,
          kvkNumber: item.kvkNummer ?? null,
          source: 'kvk',
          sourceRef: item.kvkNummer ?? null,
        });
        if (out.length >= wanted) break;
      }
    }
    return out;
  },
};
