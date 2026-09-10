/**
 * Indicators, written as pure functions over a slice of history.
 *
 * Every function here takes the values it needs and looks only backwards. That
 * is deliberate: the single most common way a backtest lies is an indicator
 * that peeks at the future — a centred moving average, a z-score computed over
 * the whole series, a "signal" normalised by statistics that include the bar it
 * is predicting. None of these functions can do that, because none of them is
 * ever handed the future.
 */

/** Simple moving average of the last `period` values. */
export function sma(values: readonly number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    sum += values[i] as number;
  }
  return sum / period;
}

/**
 * Exponential moving average, seeded with an SMA and returned at the final
 * element.
 *
 * Only the last `period * WARMUP_MULTIPLE` values are used. An EMA's weights
 * decay geometrically, so by that point the omitted history carries well under
 * a thousandth of the total weight — far less than the bid-ask spread the
 * resulting signal will trade across. Without the cap, calling this once per bar
 * from a backtest is quadratic in the length of the series, which on a minute
 * series is the difference between seconds and hours.
 */
const WARMUP_MULTIPLE = 10;

export function ema(values: readonly number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  const window =
    values.length > period * WARMUP_MULTIPLE ? values.slice(-period * WARMUP_MULTIPLE) : values;
  const k = 2 / (period + 1);
  let value = sma(window.slice(0, period), period) as number;
  for (let i = period; i < window.length; i += 1) {
    value = (window[i] as number) * k + value * (1 - k);
  }
  return value;
}

/** Sample standard deviation of the last `period` values. */
export function stdev(values: readonly number[], period: number): number | null {
  if (period <= 1 || values.length < period) return null;
  const mean = sma(values, period) as number;
  let sumSq = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const d = (values[i] as number) - mean;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / (period - 1));
}

/**
 * How many standard deviations the last value sits from its own recent mean.
 * Null when the window is flat, because dividing by a zero spread is not a
 * signal of infinite strength — it is an absence of information.
 */
export function zscore(values: readonly number[], period: number): number | null {
  const mean = sma(values, period);
  const sd = stdev(values, period);
  const last = values[values.length - 1];
  if (mean === null || sd === null || last === undefined || sd === 0) return null;
  return (last - mean) / sd;
}

/** Wilder's relative strength index over the last `period` changes. */
export function rsi(values: readonly number[], period: number): number | null {
  if (period <= 0 || values.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const change = (values[i] as number) - (values[i - 1] as number);
    if (change >= 0) gain += change;
    else loss -= change;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

/**
 * Average true range: the mean size of a bar, gaps included. Used for sizing
 * rather than for direction — a position scaled by ATR holds roughly constant
 * risk as volatility changes, which matters far more to a real account than
 * which indicator generated the entry.
 */
export function atr(
  highs: readonly number[],
  lows: readonly number[],
  closes: readonly number[],
  period: number,
): number | null {
  if (period <= 0 || closes.length < period + 1) return null;
  let sum = 0;
  for (let i = closes.length - period; i < closes.length; i += 1) {
    const high = highs[i] as number;
    const low = lows[i] as number;
    const prevClose = closes[i - 1] as number;
    sum += Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }
  return sum / period;
}

/** Simple returns of a price series: `r[i] = p[i] / p[i - 1] - 1`. */
export function returns(values: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1] as number;
    out.push(prev === 0 ? 0 : (values[i] as number) / prev - 1);
  }
  return out;
}

/** Arithmetic mean, or 0 for an empty series. */
export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** Sample standard deviation of the whole series. */
export function stdevAll(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  let sumSq = 0;
  for (const v of values) sumSq += (v - m) * (v - m);
  return Math.sqrt(sumSq / (values.length - 1));
}
