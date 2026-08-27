import type { CompanyInput } from '../db/index.ts';

export type SourceOptions = {
  /** Gemeente/plaats of provincie om op te filteren; leeg = heel Nederland. */
  area?: string;
  /** Categorie van bedrijf, bron-specifiek (bv. shop, office, craft). */
  category?: string;
  limit?: number;
  /** Pad naar bestand, voor bestandsbronnen. */
  file?: string;
};

export type Source = {
  name: string;
  description: string;
  fetch(options: SourceOptions): Promise<CompanyInput[]>;
};

export type { CompanyInput };
