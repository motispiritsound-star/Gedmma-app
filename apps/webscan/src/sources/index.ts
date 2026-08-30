import { csvSource } from './csv.ts';
import { osmSource } from './osm.ts';
import { kvkSource } from './kvk.ts';
import type { Source } from './types.ts';

export const sources: Record<string, Source> = {
  [csvSource.name]: csvSource,
  [osmSource.name]: osmSource,
  [kvkSource.name]: kvkSource,
};

export function getSource(name: string): Source {
  const source = sources[name];
  if (!source) {
    throw new Error(`Onbekende bron "${name}". Beschikbaar: ${Object.keys(sources).join(', ')}`);
  }
  return source;
}

export type { Source, SourceOptions } from './types.ts';
