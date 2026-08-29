import { getEnv } from '@/env'
import { logger } from '@/lib/logger'
import type { ScoredQuest } from './engine'

/**
 * Optional AI re-ranking.
 *
 * The deterministic engine is the product. An AI provider may only *re-order*
 * a candidate list the engine already produced - it can never introduce a quest
 * that failed a hard filter, and it can never invent content. When no provider
 * is configured (the default), `NullAiProvider` passes the ranking straight
 * through, which is why the application works with no AI credentials at all.
 *
 * Any future AI-generated *content* must go through the admin review queue and
 * be published by a human. See PRODUCT_DECISIONS.md.
 */

export interface AiRecommendationProvider {
  readonly name: string
  readonly available: boolean
  rerank(candidates: ScoredQuest[], hint: string): Promise<ScoredQuest[]>
}

export class NullAiProvider implements AiRecommendationProvider {
  readonly name = 'none'
  readonly available = false
  async rerank(candidates: ScoredQuest[]): Promise<ScoredQuest[]> {
    return candidates
  }
}

/**
 * Placeholder for a hosted model. Deliberately not wired to a network call in
 * the MVP: the interface is what future work needs, not a half-finished client.
 */
export class AnthropicAiProvider implements AiRecommendationProvider {
  readonly name = 'anthropic'
  get available(): boolean {
    return Boolean(getEnv().ANTHROPIC_API_KEY)
  }

  async rerank(candidates: ScoredQuest[], hint: string): Promise<ScoredQuest[]> {
    if (!this.available) return candidates
    logger.info('recommendations.ai_rerank_skipped', {
      reason: 'not_implemented_in_mvp',
      candidates: candidates.length,
      hint,
    })
    return candidates
  }
}

let provider: AiRecommendationProvider | null = null

export function getAiProvider(): AiRecommendationProvider {
  provider ??= getEnv().AI_DRIVER === 'anthropic' ? new AnthropicAiProvider() : new NullAiProvider()
  return provider
}
