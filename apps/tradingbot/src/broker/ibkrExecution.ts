import type { ExecutionAdapter, OrderOutcome } from '../live/execution.js';
import type { Fill } from '../types.js';
import { IbkrClient } from './ibkrClient.js';

/** IBKR paper accounts are prefixed DU. Live accounts are U, F or I. */
export function isPaperAccount(accountId: string): boolean {
  return /^DU\d+$/i.test(accountId.trim());
}

export interface IbkrExecutionOptions {
  client: IbkrClient;
  accountId: string;
  /** The contract to trade. Not a ticker — see `ibkrDataSource`. */
  conid: number;
  /**
   * Required to act on a non-paper account. Without it a live account is refused.
   *
   * This is not a formality. Everything upstream of here — the backtest, the
   * walk-forward, the noise benchmark — exists to find out whether a strategy is
   * worth money, and the honest answer is usually no. Passing this flag is the
   * moment that stops being a research question.
   */
  allowRealMoney?: boolean;
  /**
   * Never send an order whose value exceeds this. A cap in the execution layer
   * survives a bug anywhere above it, which a cap in the strategy does not.
   */
  maxOrderValue: number;
  /** Refuse orders below this value, as the venue would anyway. */
  minOrderValue?: number;
  /**
   * Whole units only, which is what shares are unless fractional trading is
   * enabled on the account. Rounding is always toward zero, so the bot can never
   * end up holding more than it asked for.
   */
  wholeUnitsOnly?: boolean;
  /** Log every order instead of sending it. The default, deliberately. */
  dryRun?: boolean;
  log?: (line: string) => void;
}

/**
 * Execution against a real IBKR account, defaulting to doing nothing.
 *
 * Three gates, in order, and all three have to be passed deliberately:
 * `dryRun` is on unless switched off, a non-`DU` account is refused unless
 * `allowRealMoney` is set, and every order is checked against `maxOrderValue`
 * before it is sent. The first two are about intent. The third is about bugs,
 * which is why it lives here rather than in the strategy: a cap the strategy
 * applies is a cap a broken strategy can skip.
 */
export class IbkrExecution implements ExecutionAdapter {
  readonly kind = 'live';
  readonly label: string;
  private readonly options: IbkrExecutionOptions;
  private readonly client: IbkrClient;
  private readonly log: (line: string) => void;
  private readonly fillLog: Fill[] = [];
  private readonly dryRun: boolean;

  constructor(options: IbkrExecutionOptions) {
    const accountId = options.accountId.trim();
    if (accountId === '') throw new Error('An IBKR account ID is required');

    if (!isPaperAccount(accountId) && options.allowRealMoney !== true) {
      throw new Error(
        `"${accountId}" does not look like an IBKR paper account (those start with DU). ` +
          `Refusing to trade it. Run the strategy on the paper account first — for ` +
          `months, not days — and if you still want this, pass --i-accept-real-money. ` +
          `Read docs/IBKR.md before you do.`,
      );
    }
    if (!Number.isFinite(options.maxOrderValue) || options.maxOrderValue <= 0) {
      throw new Error('maxOrderValue must be a positive number');
    }
    if (!Number.isInteger(options.conid) || options.conid <= 0) {
      throw new Error(`conid must be a positive contract ID, got ${options.conid}`);
    }

    this.options = { ...options, accountId };
    this.client = options.client;
    this.dryRun = options.dryRun ?? true;
    this.log = options.log ?? (() => {});
    this.label = `ibkr:${accountId}${this.dryRun ? ' (dry run)' : ''}`;
  }

  /** Net liquidation value, asked of the broker rather than tracked locally. */
  async equity(): Promise<number> {
    const ledger = await this.client.ledger(this.options.accountId);
    const base = ledger.find((entry) => entry.currency === 'BASE') ?? ledger[0];
    if (!base) throw new Error(`IBKR returned no ledger for ${this.options.accountId}`);
    return base.netLiquidation;
  }

  /** Units of the contract currently held, signed. */
  async position(): Promise<number> {
    const positions = await this.client.positions(this.options.accountId);
    const held = positions.find((p) => p.conid === this.options.conid);
    return held?.position ?? 0;
  }

  async weight(price: number): Promise<number> {
    const [equity, units] = await Promise.all([this.equity(), this.position()]);
    if (equity <= 0 || price <= 0) return 0;
    return (units * price) / equity;
  }

  async rebalanceTo(targetWeight: number, price: number, time: number): Promise<OrderOutcome> {
    if (price <= 0) return { kind: 'skipped', reason: 'no valid price' };

    const equity = await this.equity();
    if (equity <= 0) return { kind: 'skipped', reason: 'the account has no equity' };

    const held = await this.position();
    const desiredRaw = (targetWeight * equity) / price;
    const desired = this.options.wholeUnitsOnly === false ? desiredRaw : truncate(desiredRaw);
    const delta = desired - held;
    if (delta === 0) return { kind: 'skipped', reason: 'already at target, to the nearest unit' };

    const quantity = Math.abs(delta);
    const notional = quantity * price;

    const minimum = this.options.minOrderValue ?? 0;
    const isClosing = desired === 0 && held !== 0;
    if (!isClosing && notional < minimum) {
      return { kind: 'skipped', reason: `order of ${notional.toFixed(2)} is below the minimum` };
    }
    if (notional > this.options.maxOrderValue) {
      // Refused rather than trimmed: an order this size means something upstream
      // is wrong, and quietly sending a smaller one hides it.
      return {
        kind: 'skipped',
        reason:
          `order of ${notional.toFixed(2)} exceeds the ${this.options.maxOrderValue.toFixed(2)} ` +
          `cap — refusing rather than trimming, because an order this size means ` +
          `something upstream is wrong`,
      };
    }

    const side = delta > 0 ? 'BUY' : 'SELL';
    const description =
      `${side} ${quantity} of conid ${this.options.conid} at about ${price.toFixed(2)} ` +
      `(${notional.toFixed(2)} notional, target weight ${targetWeight.toFixed(3)})`;

    if (this.dryRun) {
      this.log(`  DRY RUN, not sent: ${description}`);
      return { kind: 'skipped', reason: `dry run: would have sent ${description}` };
    }

    this.log(`  sending: ${description}`);
    const placed = await this.client.placeOrder(this.options.accountId, {
      conid: this.options.conid,
      side,
      quantity,
      // Market orders only, for now. A limit order that does not fill leaves the
      // bot's idea of its position wrong until it is cancelled, and managing that
      // properly is more than this adapter does.
      orderType: 'MKT',
      tif: 'DAY',
      clientOrderId: `bot-${time}-${side}`,
    });

    return {
      kind: 'submitted',
      orderId: placed.orderId,
      requestedQuantity: delta,
      note: `${placed.status}: ${description}`,
    };
  }

  async flatten(price: number, time: number): Promise<OrderOutcome> {
    return this.rebalanceTo(0, price, time);
  }

  /**
   * Always empty.
   *
   * A live adapter does not know its fills at the moment it submits, and inventing
   * them would defeat the point of the interface. Read the position back from the
   * broker, and read the trade log from IBKR's own statements.
   */
  get fills(): readonly Fill[] {
    return this.fillLog;
  }
}

/** Round toward zero, so a rounding error can never increase exposure. */
function truncate(value: number): number {
  return value < 0 ? Math.ceil(value) : Math.floor(value);
}
