import type { ProductionState } from './types.js'

/**
 * Toegestane overgangen. Elke stap is idempotent op
 * (productionId, step, inputHash): opnieuw draaien met dezelfde invoer levert
 * het opgeslagen resultaat en geen nieuwe provideraanroep.
 *
 * `rejected` is een eindtoestand met een reden, geen fout. Een poort die nooit
 * afwijst staat te laag afgesteld, en dat wordt in de rapportage zichtbaar.
 */
const TRANSITIONS: Record<ProductionState, ProductionState[]> = {
  draft: ['angle_set', 'rejected'],
  angle_set: ['researched', 'rejected'],
  researched: ['scripted', 'rejected'],
  scripted: ['religion_checked', 'rejected'],
  religion_checked: ['fact_checked', 'scripted', 'rejected'],
  fact_checked: ['originality_checked', 'scripted', 'rejected'],
  originality_checked: ['retention_reviewed', 'scripted', 'rejected'],
  retention_reviewed: ['voiced', 'scripted', 'rejected'],
  voiced: ['storyboarded', 'rejected'],
  storyboarded: ['assets_generated', 'rejected'],
  assets_generated: ['assembled', 'rejected'],
  assembled: ['captioned', 'rejected'],
  captioned: ['packaged', 'rejected'],
  packaged: ['trust_checked', 'assembled', 'rejected'],
  trust_checked: ['awaiting_reviewer', 'rejected'],
  awaiting_reviewer: ['awaiting_approval', 'scripted', 'rejected'],
  awaiting_approval: ['approved', 'scripted', 'rejected'],
  approved: ['uploaded_private', 'rejected'],
  uploaded_private: ['scheduled', 'rejected'],
  scheduled: ['published'],
  published: ['measured'],
  measured: [],
  rejected: [],
}

export class IllegalTransitionError extends Error {
  constructor(from: ProductionState, to: ProductionState) {
    super(`Overgang ${from} -> ${to} is niet toegestaan`)
    this.name = 'IllegalTransitionError'
  }
}

export function canTransition(from: ProductionState, to: ProductionState): boolean {
  return (TRANSITIONS[from] ?? []).includes(to)
}

export function assertTransition(from: ProductionState, to: ProductionState): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to)
}

export function isTerminal(state: ProductionState): boolean {
  return (TRANSITIONS[state] ?? []).length === 0
}

/** Een productie die hier langs is, heeft geld gekost aan stem en beeld. */
export function hasExpensiveWorkStarted(state: ProductionState): boolean {
  const cheap: ProductionState[] = [
    'draft', 'angle_set', 'researched', 'scripted', 'religion_checked',
    'fact_checked', 'originality_checked', 'retention_reviewed', 'rejected',
  ]
  return !cheap.includes(state)
}
