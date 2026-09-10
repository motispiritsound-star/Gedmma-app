import type { BacktestResult } from './engine/backtest.js';
import { caveats, pct, type Metrics } from './engine/metrics.js';
import type { NoiseTestResult } from './engine/noise.js';
import type { WalkForwardResult } from './engine/walkforward.js';

const WIDTH = 74;

export function rule(char = '─'): string {
  return char.repeat(WIDTH);
}

export function heading(text: string): string {
  return `\n${text}\n${rule()}`;
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(28)}${value}`;
}

/** A ratio, with the unbounded cases spelled rather than printed as "Infinity". */
export function formatRatio(value: number): string {
  if (Number.isNaN(value)) return '-';
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '-∞';
  return value.toFixed(2);
}

export function formatMoney(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
}

export interface RenderOptions {
  /**
   * Set false when the round trips behind the numbers are not available — the
   * walk-forward stitches folds together and does not carry trade-level
   * bookkeeping across them. Printing "win rate 0%" there would be a lie.
   */
  tradeStats?: boolean;
}

export function renderMetrics(m: Metrics, options: RenderOptions = {}): string {
  const tradeStats = options.tradeStats ?? true;
  const lines = [
    row('Start equity', formatMoney(m.startEquity)),
    row('End equity', formatMoney(m.endEquity)),
    row('Total return', pct(m.totalReturn)),
    row('Buy-and-hold return', pct(m.benchmarkReturn)),
    row('Excess over holding (pp)', pct(m.excessReturn)),
    '',
    row('CAGR', pct(m.cagr)),
    row('Annual volatility', pct(m.annualVol)),
    row('Sharpe', formatRatio(m.sharpe)),
    row('Sortino', formatRatio(m.sortino)),
    row('Max drawdown', pct(m.maxDrawdown)),
    row('Buy-and-hold drawdown', pct(m.benchmarkMaxDrawdown)),
    row('Calmar', formatRatio(m.calmar)),
    '',
    row('Round trips', String(m.trades)),
    ...(tradeStats
      ? [
          row('Win rate', pct(m.winRate)),
          row('Profit factor', formatRatio(m.profitFactor)),
          row('Fees + slippage paid', formatMoney(m.feesPaid)),
          row('Turnover (x equity/yr)', m.annualTurnover.toFixed(1)),
        ]
      : []),
    row('Time in market', pct(m.timeInMarket)),
    row('t-statistic', m.tStat.toFixed(2)),
  ];
  return lines.join('\n');
}

export function renderBacktest(result: BacktestResult): string {
  const parts: string[] = [];
  parts.push(heading(`Backtest: ${result.strategy}`));
  parts.push(`  ${result.describe}`);
  const first = result.curve[0];
  const last = result.curve[result.curve.length - 1];
  if (first && last) {
    parts.push(
      `  ${result.curve.length} bars of ${result.interval}, ` +
        `${formatDate(first.time)} to ${formatDate(last.time)}`,
    );
  }
  parts.push('');
  parts.push(renderMetrics(result.metrics));

  if (result.killSwitch) {
    parts.push('');
    parts.push(`  Kill switch fired: ${result.killSwitch}`);
    parts.push(
      `  ${wrap(
        'Once it fires it does not reset, so every bar after that point is flat. ' +
          'The numbers above measure the switch as much as the strategy — raise ' +
          '--max-drawdown above the drawdown you are willing to sit through, then rerun.',
        WIDTH - 4,
      )}`,
    );
  }

  if (!result.dailyLossEnforced) {
    parts.push('');
    parts.push(
      `  ${wrap(
        'The daily loss limit was not enforced: these bars are a day or longer, ' +
          'so an intraday stop cannot be simulated from them. Test it on 1h bars ' +
          'or finer before relying on it.',
        WIDTH - 4,
      )}`,
    );
  }

  const blocked = Object.entries(result.blocked).filter(([, n]) => n > 0);
  if (blocked.length > 0) {
    parts.push('');
    parts.push('  Bars the risk layer held back:');
    for (const [reason, count] of blocked.sort((a, b) => b[1] - a[1])) {
      parts.push(`    ${String(count).padStart(6)}  ${reason}`);
    }
  }

  const warnings = caveats(result.metrics);
  if (warnings.length > 0) {
    parts.push(heading('Read this before believing the table above'));
    for (const warning of warnings) {
      parts.push(`  - ${wrap(warning, WIDTH - 4)}`);
    }
  }

  return parts.join('\n');
}

export function renderComparison(results: readonly BacktestResult[]): string {
  const parts: string[] = [heading('Side by side')];
  parts.push(
    `  ${'strategy'.padEnd(30)}${'return'.padStart(10)}${'excess'.padStart(10)}` +
      `${'sharpe'.padStart(9)}${'maxDD'.padStart(9)}${'trades'.padStart(8)}`,
  );
  for (const r of results) {
    const m = r.metrics;
    parts.push(
      `  ${r.strategy.slice(0, 29).padEnd(30)}${pct(m.totalReturn).padStart(10)}` +
        `${pct(m.excessReturn).padStart(10)}${formatRatio(m.sharpe).padStart(9)}` +
        `${pct(m.maxDrawdown).padStart(9)}${String(m.trades).padStart(8)}`,
    );
  }
  return parts.join('\n');
}

export function renderWalkForward(result: WalkForwardResult): string {
  const parts: string[] = [heading('Walk-forward (out-of-sample only)')];
  parts.push(
    `  ${'fold'.padEnd(6)}${'test window'.padEnd(28)}${'in-sample'.padStart(11)}` +
      `${'out-of-sample'.padStart(15)}${'trades'.padStart(8)}`,
  );
  for (const fold of result.folds) {
    parts.push(
      `  ${String(fold.index).padEnd(6)}` +
        `${`${formatDate(fold.testFrom)} → ${formatDate(fold.testTo)}`.slice(0, 27).padEnd(28)}` +
        `${pct(fold.inSampleReturn).padStart(11)}${pct(fold.outOfSampleReturn).padStart(15)}` +
        `${String(fold.outOfSampleTrades).padStart(8)}`,
    );
    parts.push(`         chose ${fold.chosen}`);
  }
  parts.push('');
  parts.push(renderMetrics(result.metrics, { tradeStats: false }));
  parts.push('');
  parts.push(
    `  The winning parameters changed in ${result.parameterChanges} of ` +
      `${Math.max(0, result.folds.length - 1)} fold transitions.`,
  );
  if (result.parameterChanges > result.folds.length / 2) {
    parts.push(
      `  ${wrap(
        'That instability is itself the finding: if the best settings keep ' +
          'changing, the strategy is fitting each window rather than describing ' +
          'the market, and the settings you pick today will be the wrong ones tomorrow.',
        WIDTH - 4,
      )}`,
    );
  }
  return parts.join('\n');
}

export function renderNoise(result: NoiseTestResult, realSharpe: number | null): string {
  const parts: string[] = [heading('What this strategy "earns" on pure noise')];
  parts.push(
    `  ${result.runs} random walks, each with nothing in it to predict. Sharpe ratios:`,
  );
  parts.push('');
  parts.push(row('worst', result.worst.toFixed(2)));
  parts.push(row('median', result.median.toFixed(2)));
  parts.push(row('95th percentile', result.p95.toFixed(2)));
  parts.push(row('best', result.best.toFixed(2)));
  if (realSharpe !== null) {
    parts.push('');
    parts.push(row('on real data', realSharpe.toFixed(2)));
    parts.push('');
    const verdict =
      realSharpe > result.p95
        ? 'The real result clears the 95th percentile of noise. That is the minimum ' +
          'bar for calling it an edge — not proof, but not nothing either.'
        : 'The real result sits inside the range this strategy produces from random ' +
          'data. There is no evidence of an edge here, however good the equity curve looks.';
    parts.push(`  ${wrap(verdict, WIDTH - 4)}`);
  }
  return parts.join('\n');
}

/** Wrap text to a width, indenting continuation lines to line up. */
export function wrap(text: string, width: number, indent = '    '): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length + word.length + 1 > width && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = line === '' ? word : `${line} ${word}`;
    }
  }
  if (line !== '') lines.push(line);
  return lines.join(`\n${indent}`);
}
