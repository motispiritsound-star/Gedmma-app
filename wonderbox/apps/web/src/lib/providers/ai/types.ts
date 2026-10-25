import { z } from 'zod';

/**
 * AI drafting for adult content editors.
 *
 * Two rules are enforced structurally, not by convention:
 *   1. This port is only ever called from the studio, behind `content.aiDraft`.
 *      There is no code path from a child's device to a model.
 *   2. Everything it returns is persisted as ContentVersion(state=DRAFT,
 *      source=AI_DRAFT). `publishVersion` refuses to publish a version without
 *      a human Approval row, so a draft cannot reach a child unreviewed.
 */

export const DraftRequestSchema = z.object({
  kind: z.enum(['chapterOutline', 'dialogueNode', 'experimentSteps', 'translation']),
  themeSlug: z.string().min(1),
  ageMin: z.number().int().min(5).max(12),
  ageMax: z.number().int().min(5).max(12),
  locale: z.enum(['nl', 'en']),
  /** What the editor is asking for, in their own words. */
  brief: z.string().min(10).max(4000),
  /** Existing copy to translate or rewrite. */
  sourceText: z.string().max(8000).optional(),
});

export type DraftRequest = z.infer<typeof DraftRequestSchema>;

export interface DraftSuggestion {
  readonly title: string;
  readonly body: string;
  /** Notes the reviewer must read before approving. */
  readonly reviewNotes: readonly string[];
}

export interface AiDraftResult {
  readonly provider: string;
  readonly model: string;
  readonly suggestions: readonly DraftSuggestion[];
  readonly generatedAt: Date;
}

export interface AiDraftProvider {
  readonly name: string;
  readonly model: string;
  draft(request: DraftRequest): Promise<AiDraftResult>;
}
