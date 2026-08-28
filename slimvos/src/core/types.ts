/** Gedeelde typen voor het leerdomein. Dit bestand mag géén React-Native imports bevatten. */

export type Groep = 3 | 4 | 5 | 6 | 7 | 8;
export const GROEPEN: Groep[] = [3, 4, 5, 6, 7, 8];

export type VakId = 'rekenen' | 'taal' | 'lezen' | 'engels' | 'wereld';

export interface Vak {
  id: VakId;
  naam: string;
  emoji: string;
  kleur: string;
  omschrijving: string;
}

/** Een onderwerp is de kleinste eenheid waarop voortgang wordt bijgehouden. */
export interface Onderwerp {
  id: string;
  vak: VakId;
  naam: string;
  emoji: string;
  /** Groepen waarvoor dit onderwerp getoond wordt, oplopend gesorteerd. */
  groepen: Groep[];
  /** Korte uitleg van wat je hier oefent, in kindertaal. */
  doel: string;
}

export type VraagType = 'keuze' | 'invul';

export interface Vraag {
  id: string;
  onderwerpId: string;
  /** 1 t/m 5; hoger is moeilijker. */
  niveau: number;
  type: VraagType;
  /** Optionele leestekst of context boven de vraag. */
  context?: string;
  stam: string;
  /** Alleen bij type 'keuze'. */
  opties?: string[];
  antwoord: string;
  uitleg: string;
  /** Bijv. 'cm' of '€'; wordt naast het invulveld getoond. */
  eenheid?: string;
}

export interface Antwoord {
  vraagId: string;
  gegeven: string;
  goed: boolean;
  /** Milliseconden die het kind over de vraag deed. */
  duurMs: number;
}

export const MAX_NIVEAU = 5;
export const MIN_NIVEAU = 1;
