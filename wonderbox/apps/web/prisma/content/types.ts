/**
 * The authoring format for seeded content.
 *
 * This mirrors what the content studio produces, so a box written by hand here
 * and a box built in the studio end up as the same rows. Keys are stable
 * human-readable slugs: the seed is re-runnable and references nodes by key
 * rather than by generated id.
 */

/**
 * A locale map. The index signature is what lets Prisma accept it directly as
 * a Json column value; `nl` and `en` are required so a missing translation is
 * a compile error rather than a gap a child hits at runtime.
 */
export interface Text {
  readonly nl: string;
  readonly en: string;
  readonly [locale: string]: string;
}

export interface ChoiceSpec {
  readonly key: string;
  readonly label: Text;
  /** Key of the node this choice leads to. Omit for repeat/slower choices. */
  readonly target?: string;
  readonly isRepeat?: boolean;
  readonly isSlower?: boolean;
}

export type NodeKind =
  | 'NARRATION'
  | 'QUESTION'
  | 'HINT'
  | 'PAUSE'
  | 'EXPERIMENT_STEP'
  | 'SAFETY'
  | 'CELEBRATION';

export interface NodeSpec {
  readonly key: string;
  readonly kind: NodeKind;
  readonly text: Text;
  /** Seconds of silence after the narration, so a child can actually do it. */
  readonly pauseSeconds?: number;
  readonly isTerminal?: boolean;
  readonly experimentKey?: string;
  readonly safetyCode?: string;
  readonly choices?: readonly ChoiceSpec[];
}

export interface ExperimentSpec {
  readonly key: string;
  readonly title: Text;
  readonly objective: Text;
  readonly steps: readonly Text[];
  readonly materials: readonly Text[];
  readonly durationMinutes: number;
  readonly requiresAdult?: boolean;
  readonly safetyCodes?: readonly string[];
}

export interface ChapterSpec {
  readonly key: string;
  readonly title: Text;
  readonly intro: Text;
  readonly estimatedMinutes: number;
  readonly entryNodeKey: string;
  readonly experiments: readonly ExperimentSpec[];
  readonly nodes: readonly NodeSpec[];
}

export interface ComponentSpec {
  readonly sku: string;
  readonly name: string;
  readonly kind: 'COMPONENT' | 'PACKAGING' | 'PRINTED' | 'FINISHED_BOX';
  readonly quantity: number;
  readonly stock: number;
  readonly note?: Text;
}

export interface SafetySpec {
  readonly code: string;
  readonly severity: 'INFO' | 'CAUTION' | 'WARNING';
  readonly text: Text;
  readonly requiresAdult?: boolean;
}

export interface BoxSpec {
  readonly sku: string;
  readonly slug: string;
  readonly themeSlug: string;
  readonly ageMin: number;
  readonly ageMax: number;
  readonly priceCents: number;
  readonly curriculumIndex: number;
  readonly translations: {
    readonly nl: { name: string; tagline: string; description: string; materialsNote: string };
    readonly en: { name: string; tagline: string; description: string; materialsNote: string };
  };
  readonly components: readonly ComponentSpec[];
  readonly safety: readonly SafetySpec[];
  readonly journey: {
    readonly slug: string;
    readonly title: Text;
    readonly summary: Text;
    readonly estimatedMinutes: number;
    readonly chapters: readonly ChapterSpec[];
  };
}
