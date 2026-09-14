import { randomUUID } from 'node:crypto'
import type { AuditEvent, CostEntry } from '../domain/types.js'

export class BudgetExceededError extends Error {
  constructor(scope: string, spentCents: number, capCents: number) {
    super(
      `Kostenplafond ${scope} bereikt: ${(spentCents / 100).toFixed(2)} EUR van ` +
      `${(capCents / 100).toFixed(2)} EUR. De wachtrij pauzeert; geen stille doorbelasting.`,
    )
    this.name = 'BudgetExceededError'
  }
}

export interface BudgetCaps {
  perProductionCents: number
  perDayCents: number
  perMonthCents: number
}

/**
 * Kostenregistratie en auditlog. Het auditlog is append-only: poortuitslagen,
 * goedkeuringen, drempelwijzigingen, uploads en elke provideraanroep met kosten.
 */
export class Ledger {
  private readonly costs: CostEntry[] = []
  private readonly events: AuditEvent[] = []

  constructor(private readonly caps: BudgetCaps) {}

  record(entry: Omit<CostEntry, 'id' | 'at'>): CostEntry {
    const full: CostEntry = { ...entry, id: randomUUID(), at: new Date().toISOString() }
    const perProduction = this.spentOn(entry.productionId) + entry.costCents
    if (perProduction > this.caps.perProductionCents) {
      throw new BudgetExceededError(`productie ${entry.productionId}`, perProduction, this.caps.perProductionCents)
    }
    const today = full.at.slice(0, 10)
    const perDay = this.costs
      .filter((c) => c.at.startsWith(today))
      .reduce((sum, c) => sum + c.costCents, 0) + entry.costCents
    if (perDay > this.caps.perDayCents) {
      throw new BudgetExceededError('dag', perDay, this.caps.perDayCents)
    }
    const total = this.totalCents() + entry.costCents
    if (total > this.caps.perMonthCents) {
      throw new BudgetExceededError('maand', total, this.caps.perMonthCents)
    }
    this.costs.push(full)
    return full
  }

  audit(kind: string, productionId: string | null, detail: Record<string, unknown> = {}): void {
    this.events.push({ id: randomUUID(), productionId, kind, detail, at: new Date().toISOString() })
  }

  spentOn(productionId: string): number {
    return this.costs
      .filter((c) => c.productionId === productionId)
      .reduce((sum, c) => sum + c.costCents, 0)
  }

  totalCents(): number {
    return this.costs.reduce((sum, c) => sum + c.costCents, 0)
  }

  byStep(productionId: string): { step: string; provider: string; cents: number }[] {
    const acc = new Map<string, { step: string; provider: string; cents: number }>()
    for (const c of this.costs.filter((x) => x.productionId === productionId)) {
      const key = `${c.step}|${c.provider}`
      const cur = acc.get(key) ?? { step: c.step, provider: c.provider, cents: 0 }
      cur.cents += c.costCents
      acc.set(key, cur)
    }
    return [...acc.values()]
  }

  auditTrail(): readonly AuditEvent[] { return this.events }

  /**
   * Break-even views voor deze productie, gegeven een RPM-bandbreedte.
   * Het dashboard toont dit vóór goedkeuring (zie docs/06).
   */
  breakEvenViews(
    productionId: string,
    opts: { rpmEur: number; monthlyFixedEur: number; videosThisMonth: number },
  ): number {
    const variableEur = this.spentOn(productionId) / 100
    const shareOfFixed = opts.monthlyFixedEur / Math.max(1, opts.videosThisMonth)
    return Math.ceil(((variableEur + shareOfFixed) / opts.rpmEur) * 1000)
  }
}
