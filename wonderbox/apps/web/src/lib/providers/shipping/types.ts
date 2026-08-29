/**
 * The fulfilment port. WonderBox does not run a warehouse: it hands parcels to
 * a provider and listens for status callbacks. Swapping PostNL for a 3PL means
 * writing one adapter, not touching the order flow.
 */

export interface ShippingAddressInput {
  readonly recipient: string;
  readonly line1: string;
  readonly line2?: string | null;
  readonly postalCode: string;
  readonly city: string;
  readonly region?: string | null;
  readonly country: string;
  readonly phone?: string | null;
}

export interface ParcelInput {
  readonly reference: string;
  readonly weightGrams: number;
  readonly items: ReadonlyArray<{ sku: string; quantity: number; description: string }>;
}

export interface ShippingLabel {
  readonly providerRef: string;
  readonly trackingCode: string;
  /** Key in private object storage, never a public URL. */
  readonly labelKey: string;
  readonly carrier: string;
}

export interface ShipmentUpdate {
  readonly id: string;
  readonly providerRef: string;
  readonly status: 'label_created' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  readonly occurredAt: Date;
  readonly raw: unknown;
}

export interface ShippingRate {
  readonly cents: number;
  readonly currency: 'EUR';
  readonly serviceName: string;
  readonly estimatedDays: number;
}

export interface ShippingProvider {
  readonly name: string;
  quote(input: { destination: ShippingAddressInput; parcel: ParcelInput }): Promise<ShippingRate>;
  createLabel(input: {
    destination: ShippingAddressInput;
    parcel: ParcelInput;
    idempotencyKey: string;
  }): Promise<ShippingLabel>;
  cancelLabel(providerRef: string): Promise<void>;
  parseWebhook(rawBody: string, signature: string | null): Promise<ShipmentUpdate | null>;
}
