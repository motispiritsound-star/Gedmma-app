/**
 * How a purchase order reaches a supplier.
 *
 * Most small suppliers take a body of text by email; a few want a CSV dropped
 * somewhere; the large distributors have an API. All three are the same shape
 * from the application's point of view, which is what this port is for.
 */
export interface PurchaseOrderDocument {
  readonly number: string;
  readonly supplierName: string;
  readonly supplierEmail: string | null;
  readonly currency: string;
  readonly subtotalCents: number;
  readonly expectedAt: Date | null;
  readonly notes: string | null;
  readonly lines: ReadonlyArray<{
    supplierSku: string | null;
    sku: string;
    name: string;
    quantity: number;
    unitCostCents: number;
    lineCents: number;
  }>;
}

export interface DispatchResult {
  readonly ok: boolean;
  /** What the channel did, in words an operator can act on. */
  readonly detail: string;
  /** Reference the supplier's side gave back, when there is one. */
  readonly externalRef?: string;
}

export interface SupplierChannelAdapter {
  readonly name: string;
  send(document: PurchaseOrderDocument): Promise<DispatchResult>;
}
