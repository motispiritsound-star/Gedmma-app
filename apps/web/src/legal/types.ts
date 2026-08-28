import type { LegalPageKey } from '@buurklus/shared';

/**
 * The shape of a published legal document.
 *
 * Prose is prose, but three things must never be typed out by hand: how long
 * data is kept, who is responsible, and what someone's rights are. Those come
 * from @buurklus/shared and from the code that enforces them, so the page
 * cannot promise a deletion that never happens or name a company that does not
 * exist. A section asks for them by setting `generated`.
 */
export type GeneratedBlock =
  | 'operator'
  | 'retention'
  | 'rights'
  | 'processors'
  | 'dataCategories';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  generated?: GeneratedBlock;
}

export interface LegalDocument {
  /** Page title and <h1>. */
  title: string;
  /** One or two sentences under the title, before the first heading. */
  intro: string;
  /** Shown in the browser tab and in search results. */
  metaDescription: string;
  sections: LegalSection[];
}

export type LegalCopy = Record<LegalPageKey, LegalDocument>;

/** Column headings for the generated tables, which differ per language. */
export interface LegalTableLabels {
  data: string;
  purpose: string;
  basis: string;
  period: string;
  reason: string;
  right: string;
  how: string;
  processor: string;
  role: string;
  location: string;
}

export interface LegalChrome {
  /** What each document is called in navigation and in the footer. */
  pageNames: Record<LegalPageKey, string>;
  lastUpdated: string;
  /** Heading above the list of what the operator still has to fill in. */
  incompleteTitle: string;
  incompleteBody: string;
  incompleteFields: Record<string, string>;
  backToSite: string;
  otherDocuments: string;
  /** Says which language version prevails. */
  languageNote: string;
  tables: LegalTableLabels;
  /** Rows of the "your rights" table: label, what it means, how to use it. */
  rights: { right: string; how: string }[];
  /** Rows of the processor table. */
  processors: { processor: string; role: string; location: string }[];
  /** Rows of the "what we process and why" table. */
  dataCategories: { data: string; purpose: string; basis: string }[];
}
