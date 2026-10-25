import type { AiDraftProvider, AiDraftResult, DraftRequest, DraftSuggestion } from './types.ts';

/**
 * Offline drafting stub. It produces plausibly-shaped scaffolding so an editor
 * can exercise the review workflow without a network or an API key — and so
 * the "unapproved content is not playable" test has something to try to sneak
 * past the approval gate.
 */
export class MockAiDraftProvider implements AiDraftProvider {
  readonly name = 'mock';
  readonly model = 'mock-draft-1';

  async draft(request: DraftRequest): Promise<AiDraftResult> {
    const suggestions: DraftSuggestion[] = [];
    const audience = `${request.ageMin}-${request.ageMax}`;

    if (request.kind === 'translation' && request.sourceText) {
      suggestions.push({
        title: `Draft translation (${request.locale})`,
        body: `[${request.locale.toUpperCase()} DRAFT] ${request.sourceText}`,
        reviewNotes: [
          'Machine draft: check idiom and reading level before approving.',
          'Verify that safety wording survived the translation word for word.',
        ],
      });
    } else {
      suggestions.push({
        title: `Draft ${request.kind} for ${request.themeSlug} (ages ${audience})`,
        body: [
          `Brief: ${request.brief.trim()}`,
          '',
          '1. Open with a question the child can answer out loud.',
          '2. Give one instruction at a time, then pause.',
          '3. Offer a hint branch for a child who is stuck.',
          '4. Close by naming what they just discovered.',
        ].join('\n'),
        reviewNotes: [
          'Machine draft. Not playable until a human approver signs it off.',
          'Check every instruction against the physical kit contents.',
          'Confirm there is nothing a child could do unsupervised that needs an adult.',
        ],
      });
    }

    return {
      provider: this.name,
      model: this.model,
      suggestions,
      generatedAt: new Date(),
    };
  }
}
