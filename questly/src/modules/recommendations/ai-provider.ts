import type { ScoredQuest } from "./types";
import type { RecommendationContext } from "./types";

/**
 * Optional enhancement layer on top of the deterministic engine.
 *
 * Contract:
 *  - the deterministic ranking is always computed first and is always valid on
 *    its own; an enhancer may only re-order or annotate what it receives;
 *  - an enhancer may never introduce a quest that was not in the candidate set,
 *    so it cannot bypass age-band or entitlement filtering;
 *  - any AI-generated *content* (as opposed to ranking) enters as a DRAFT quest
 *    and must be published by a human content administrator.
 */
export interface RecommendationEnhancer {
  readonly name: string;
  enhance(candidates: ScoredQuest[], context: RecommendationContext): Promise<ScoredQuest[]>;
}

/** The default. No network, no credentials, no behaviour change. */
export class NoopEnhancer implements RecommendationEnhancer {
  readonly name = "none";
  async enhance(candidates: ScoredQuest[]): Promise<ScoredQuest[]> {
    return candidates;
  }
}

export type ContentDraftRequest = {
  categorySlug: string;
  ageBand: "AGE_6_8" | "AGE_9_11" | "AGE_12_15";
  brief: string;
};

/**
 * Future extension point for AI-assisted quest authoring. Deliberately not
 * implemented in the MVP: anything it produced would still need to land in the
 * admin editor as a draft for human review before publication.
 */
export interface ContentDraftProvider {
  readonly name: string;
  draftQuest(request: ContentDraftRequest): Promise<never>;
}

let cached: RecommendationEnhancer | null = null;

export function recommendationEnhancer(): RecommendationEnhancer {
  cached ??= new NoopEnhancer();
  return cached;
}

export function setRecommendationEnhancer(enhancer: RecommendationEnhancer | null): void {
  cached = enhancer;
}
