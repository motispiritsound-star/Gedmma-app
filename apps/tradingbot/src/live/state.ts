import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { BrokerState } from '../engine/broker.js';
import type { RiskState } from '../risk/risk.js';
import type { Interval } from '../types.js';

/** Bumped whenever the shape changes, so an old file is refused rather than misread. */
export const STATE_VERSION = 1;

export interface PaperState {
  version: number;
  symbol: string;
  interval: Interval;
  strategy: string;
  /** openTime of the last bar acted on, so a restart does not re-trade it. */
  lastBarTime: number;
  startedAt: string;
  updatedAt: string;
  broker: BrokerState;
  risk: RiskState;
}

/**
 * Write the run's state where a restart can find it.
 *
 * The write goes to a temporary file and is then renamed, because rename is
 * atomic on every filesystem this will run on and a plain write is not. A bot
 * killed halfway through writing its own state is how a 24/7 run turns into a
 * corrupt file and a silent reset to starting cash.
 */
export function saveState(path: string, state: PaperState): void {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(temp, path);
}

/**
 * Read a saved run, or return null if there is nothing to resume.
 *
 * A state file for a different symbol, interval or strategy is refused outright.
 * Resuming one strategy's account into another's is not a recoverable error, it
 * is a wrong answer that looks like a working bot.
 */
export function loadState(
  path: string,
  expect: { symbol: string; interval: Interval; strategy: string },
): PaperState | null {
  if (!existsSync(path)) return null;

  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<PaperState>;
  if (parsed.version !== STATE_VERSION) {
    throw new Error(
      `${path} was written by version ${String(parsed.version)}, and this build reads ` +
        `version ${STATE_VERSION}. Move it aside and start a fresh run.`,
    );
  }

  const mismatches: string[] = [];
  if (parsed.symbol !== expect.symbol) mismatches.push(`symbol ${parsed.symbol} ≠ ${expect.symbol}`);
  if (parsed.interval !== expect.interval) {
    mismatches.push(`interval ${parsed.interval} ≠ ${expect.interval}`);
  }
  if (parsed.strategy !== expect.strategy) {
    mismatches.push(`strategy ${parsed.strategy} ≠ ${expect.strategy}`);
  }
  if (mismatches.length > 0) {
    throw new Error(
      `${path} belongs to a different run (${mismatches.join(', ')}). ` +
        `Use a separate --state file per strategy.`,
    );
  }

  if (!parsed.broker || !parsed.risk || typeof parsed.lastBarTime !== 'number') {
    throw new Error(`${path} is missing the broker or risk state and cannot be resumed`);
  }

  return parsed as PaperState;
}
