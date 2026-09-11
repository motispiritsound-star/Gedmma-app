import type { KrakenPair } from '../data/kraken.js';
import type { ExecutionAdapter, OrderOutcome } from '../live/execution.js';
import type { Fill } from '../types.js';
import type { KrakenClient } from './krakenClient.js';

export interface KrakenExecutionOptions {
  client: KrakenClient;
  /** Pair metadata from `fetchPair`, for the decimals and the minimum order. */
  pair: KrakenPair;
  /**
   * Kraken has **no paper-trading account for spot**, so there is no harmless
   * version of sending an order here. Required alongside `send`.
   */
  allowRealMoney?: boolean;
  /**
   * Send orders for real. Left false, every order is handed to Kraken's own
   * `validate` endpoint instead: the exchange checks decimals, minimums, the pair
   * and your key's permissions, and executes nothing.
   */
  send?: boolean;
  /** Hard cap per order, in quote currency. Enforced here, not in the strategy. */
  maxOrderValue: number;
  log?: (line: string) => void;
}

/**
 * Execution against a real Kraken spot account.
 *
 * The difference from the IBKR adapter is worth stating plainly, because it
 * changes what "dry run" means. IBKR gives you a paper account with its own money,
 * so a full rehearsal is possible. Kraken does not: for spot there is no demo
 * account, and an order that is sent is real. What exists instead is Kraken's
 * `validate` flag, which has the exchange check an order without placing it — so
 * this adapter validates server-side by default, and needs both `send` and
 * `allowRealMoney` before anything executes.
 *
 * Equity is measured as the quote balance plus the base balance at the current
 * price, which is what the strategy reasons about. Anything else in the account is
 * deliberately ignored — but note the flip side: coins of the base asset that you
 * bought by hand are *not* ignored, and the bot will manage them as if they were
 * its own. Use a dedicated account or subaccount if that is not what you want.
 */
export class KrakenExecution implements ExecutionAdapter {
  readonly kind = 'live';
  readonly label: string;
  private readonly options: KrakenExecutionOptions;
  private readonly client: KrakenClient;
  private readonly log: (line: string) => void;
  private readonly validateOnly: boolean;
  private readonly fillLog: Fill[] = [];

  constructor(options: KrakenExecutionOptions) {
    if (!Number.isFinite(options.maxOrderValue) || options.maxOrderValue <= 0) {
      throw new Error('maxOrderValue must be a positive number');
    }
    if (!options.client.hasCredentials) {
      throw new Error(
        'No Kraken credentials. Set KRAKEN_API_KEY and KRAKEN_API_SECRET in the ' +
          'environment, from a key with withdrawals disabled.',
      );
    }
    if (options.send === true && options.allowRealMoney !== true) {
      throw new Error(
        'Kraken has no paper account for spot, so --send means real money on a real ' +
          'exchange. Pass --i-accept-real-money as well if that is what you mean. ' +
          'Without --send, every order is checked by Kraken and executed by nobody.',
      );
    }

    this.options = options;
    this.client = options.client;
    this.validateOnly = options.send !== true;
    this.log = options.log ?? (() => {});
    this.label = `kraken:${options.pair.altname}${this.validateOnly ? ' (validate only)' : ''}`;
  }

  /** Quote balance plus the base holding at `price`. */
  async equity(price: number): Promise<number> {
    const balances = await this.client.balances();
    const quote = balances[this.options.pair.quote] ?? 0;
    const base = balances[this.options.pair.base] ?? 0;
    return quote + base * price;
  }

  /** Units of the base asset held. Includes anything bought by hand. */
  async position(): Promise<number> {
    const balances = await this.client.balances();
    return balances[this.options.pair.base] ?? 0;
  }

  async weight(price: number): Promise<number> {
    if (price <= 0) return 0;
    const balances = await this.client.balances();
    const quote = balances[this.options.pair.quote] ?? 0;
    const base = balances[this.options.pair.base] ?? 0;
    const equity = quote + base * price;
    if (equity <= 0) return 0;
    return (base * price) / equity;
  }

  async rebalanceTo(targetWeight: number, price: number, time: number): Promise<OrderOutcome> {
    if (price <= 0) return { kind: 'skipped', reason: 'no valid price' };
    if (targetWeight < 0) {
      // Spot cannot short. Refusing beats silently treating -1 as flat, which
      // would make a short-enabled strategy look like it had been tested here.
      return {
        kind: 'skipped',
        reason: 'this is a spot account and cannot go short; use a long-only strategy',
      };
    }

    const balances = await this.client.balances();
    const quote = balances[this.options.pair.quote] ?? 0;
    const held = balances[this.options.pair.base] ?? 0;
    const equity = quote + held * price;
    if (equity <= 0) return { kind: 'skipped', reason: 'the account has no equity' };

    const desiredRaw = (targetWeight * equity) / price;
    // Rounded down, always: a volume with one decimal too many is rejected, and
    // rounding up could ask for more of the asset than the cash covers.
    const desired = floorTo(desiredRaw, this.options.pair.volumeDecimals);
    const delta = floorTo(Math.abs(desired - held), this.options.pair.volumeDecimals);
    if (delta === 0) {
      return { kind: 'skipped', reason: 'already at target, to the pair’s decimals' };
    }

    const side = desired > held ? 'buy' : 'sell';
    const notional = delta * price;

    if (delta < this.options.pair.orderMin) {
      return {
        kind: 'skipped',
        reason:
          `${delta} is below Kraken's minimum order of ${this.options.pair.orderMin} ` +
          `${this.options.pair.base} for this pair`,
      };
    }
    if (notional > this.options.maxOrderValue) {
      return {
        kind: 'skipped',
        reason:
          `order of ${notional.toFixed(2)} exceeds the ${this.options.maxOrderValue.toFixed(2)} ` +
          `cap — refusing rather than trimming, because an order this size means ` +
          `something upstream is wrong`,
      };
    }
    // Unreachable for a target weight at or below 1, because equity is defined as
    // quote + base·price and so a buy can never cost more than the quote balance.
    // It catches a caller asking for leverage on a spot account, which is the one
    // way to get here — and which Kraken would reject with a less obvious message.
    if (side === 'buy' && notional > quote) {
      return {
        kind: 'skipped',
        reason:
          `buying ${notional.toFixed(2)} needs more ${this.options.pair.quote} than the ` +
          `${quote.toFixed(2)} held — a spot account cannot borrow, so a target weight ` +
          `above 1 is not available here`,
      };
    }

    const volume = delta.toFixed(this.options.pair.volumeDecimals);
    const description =
      `${side} ${volume} ${this.options.pair.base} at about ${price.toFixed(2)} ` +
      `(${notional.toFixed(2)} ${this.options.pair.quote}, target weight ${targetWeight.toFixed(3)})`;

    const result = await this.client.addOrder({
      pair: this.options.pair.altname,
      type: side,
      ordertype: 'market',
      volume,
      validate: this.validateOnly,
      // Kraken wants a 32-bit unsigned integer, so the bar's timestamp is folded
      // into one rather than sent as milliseconds since 1970.
      userref: time % 2_147_483_647,
    });

    if (this.validateOnly) {
      this.log(`  validated by Kraken, not sent: ${result.description || description}`);
      return { kind: 'skipped', reason: `validate only: Kraken accepted "${result.description || description}"` };
    }

    this.log(`  sent: ${description}`);
    return {
      kind: 'submitted',
      orderId: result.txids[0] ?? '',
      requestedQuantity: side === 'buy' ? delta : -delta,
      note: result.description || description,
    };
  }

  async flatten(price: number, time: number): Promise<OrderOutcome> {
    return this.rebalanceTo(0, price, time);
  }

  /**
   * Always empty. A market order's fills are known to Kraken, not to the moment
   * the order was sent; read the position back, and the trade log from Kraken.
   */
  get fills(): readonly Fill[] {
    return this.fillLog;
  }
}

/** Round down to `decimals` places, so rounding never increases an order. */
export function floorTo(value: number, decimals: number): number {
  const places = Math.max(0, Math.min(12, Math.floor(decimals)));
  const factor = 10 ** places;
  return Math.floor(value * factor + 1e-9) / factor;
}
