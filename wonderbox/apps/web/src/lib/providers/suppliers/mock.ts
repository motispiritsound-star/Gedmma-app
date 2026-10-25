import { formatCents } from '../../money.ts';
import type { DispatchResult, PurchaseOrderDocument, SupplierChannelAdapter } from './types.ts';

/**
 * Renders a purchase order the way a supplier would receive it, and keeps it
 * in memory instead of sending it anywhere.
 *
 * This is the default in development and in tests, deliberately: a purchase
 * order commits real money, and a system that can email suppliers by accident
 * during a test run is a system nobody should be asked to run.
 */
export class MockSupplierChannel implements SupplierChannelAdapter {
  readonly name = 'mock';

  private readonly sent: PurchaseOrderDocument[] = [];

  async send(document: PurchaseOrderDocument): Promise<DispatchResult> {
    this.sent.push(document);
    return {
      ok: true,
      detail: `Niet verstuurd (mock): ${document.lines.length} regels, ${formatCents(
        document.subtotalCents,
        'EUR',
        'nl-NL',
      )}.`,
      externalRef: `mock-${document.number}`,
    };
  }

  /** Test and development helper: what would have gone out. */
  outbox(): readonly PurchaseOrderDocument[] {
    return this.sent;
  }

  clear(): void {
    this.sent.length = 0;
  }
}

/** The plain-text body an EMAIL-channel supplier receives. */
export function renderPurchaseOrder(document: PurchaseOrderDocument): string {
  const euro = (cents: number) => formatCents(cents, 'EUR', 'nl-NL');
  const lines = document.lines
    .map(
      (line) =>
        `${String(line.quantity).padStart(6)} ×  ${(line.supplierSku ?? line.sku).padEnd(24)}` +
        `${line.name}\n${' '.repeat(9)}${euro(line.unitCostCents)} per stuk — ${euro(line.lineCents)}`,
    )
    .join('\n');

  return [
    `Inkooporder ${document.number}`,
    `Aan: ${document.supplierName}`,
    '',
    lines,
    '',
    `Totaal: ${euro(document.subtotalCents)} (excl. btw)`,
    document.expectedAt
      ? `Gewenste leverdatum: ${document.expectedAt.toLocaleDateString('nl-NL')}`
      : '',
    document.notes ? `\n${document.notes}` : '',
    '',
    'WonderBox — graag een orderbevestiging met leverdatum.',
  ]
    .filter(Boolean)
    .join('\n');
}
