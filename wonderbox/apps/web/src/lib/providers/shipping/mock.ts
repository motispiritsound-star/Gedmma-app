import { createHmac, randomUUID } from 'node:crypto';
import { safeEqual } from '../../crypto.ts';
import type {
  ParcelInput,
  ShipmentUpdate,
  ShippingAddressInput,
  ShippingLabel,
  ShippingProvider,
  ShippingRate,
} from './types.ts';

/**
 * Local fulfilment simulator. Labels are deterministic per idempotency key, so
 * a retried fulfilment run does not mint a second parcel for the same order.
 */
export class MockShippingProvider implements ShippingProvider {
  readonly name = 'mock';

  private labels = new Map<string, ShippingLabel>();

  constructor(
    private readonly webhookSecret: string,
    private readonly flatRateCents: number,
    private readonly originCountry: string,
  ) {}

  async quote(input: {
    destination: ShippingAddressInput;
    parcel: ParcelInput;
  }): Promise<ShippingRate> {
    const domestic = input.destination.country.toUpperCase() === this.originCountry.toUpperCase();
    const surcharge = domestic ? 0 : 450;
    const heavy = input.parcel.weightGrams > 2000 ? 200 : 0;
    return {
      cents: this.flatRateCents + surcharge + heavy,
      currency: 'EUR',
      serviceName: domestic ? 'Standard NL' : 'Standard EU',
      estimatedDays: domestic ? 2 : 5,
    };
  }

  async createLabel(input: {
    destination: ShippingAddressInput;
    parcel: ParcelInput;
    idempotencyKey: string;
  }): Promise<ShippingLabel> {
    const existing = this.labels.get(input.idempotencyKey);
    if (existing) return existing;
    const providerRef = `shp_mock_${randomUUID().slice(0, 12)}`;
    const label: ShippingLabel = {
      providerRef,
      trackingCode: `3SMOCK${providerRef.slice(-8).toUpperCase()}`,
      labelKey: `labels/${providerRef}.pdf`,
      carrier: 'MockPost',
    };
    this.labels.set(input.idempotencyKey, label);
    return label;
  }

  async cancelLabel(providerRef: string): Promise<void> {
    for (const [key, label] of this.labels) {
      if (label.providerRef === providerRef) this.labels.delete(key);
    }
  }

  async parseWebhook(rawBody: string, signature: string | null): Promise<ShipmentUpdate | null> {
    if (!signature) return null;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    if (!safeEqual(expected, signature)) return null;
    const body = JSON.parse(rawBody) as {
      id?: string;
      providerRef?: string;
      status?: string;
      occurredAt?: string;
    };
    const allowed = ['label_created', 'in_transit', 'delivered', 'failed', 'returned'] as const;
    if (!body.id || !body.providerRef || !body.status) return null;
    if (!(allowed as readonly string[]).includes(body.status)) return null;
    return {
      id: body.id,
      providerRef: body.providerRef,
      status: body.status as ShipmentUpdate['status'],
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      raw: body,
    };
  }

  /** Test/dev helper for driving a parcel through its lifecycle. */
  signWebhook(body: unknown): { body: string; signature: string } {
    const raw = JSON.stringify(body);
    return {
      body: raw,
      signature: createHmac('sha256', this.webhookSecret).update(raw).digest('hex'),
    };
  }
}
