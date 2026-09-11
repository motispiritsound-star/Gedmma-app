import { survivorshipWarning } from './data/align.js';
import type { BacktestResult } from './engine/backtest.js';
import type { CorrelationReport } from './engine/correlation.js';
import type { PortfolioResult } from './engine/portfolio.js';
import type { PortfolioWalkForwardResult } from './engine/portfolioWalkforward.js';
import type { SignificanceResult } from './engine/significance.js';
import { caveats, pct, type Metrics } from './engine/metrics.js';
import { bootstrapDrawdowns, minimumTrackRecordLength } from './engine/robustness.js';
import type { NoiseTestResult, PortfolioNoiseResult } from './engine/noise.js';
import type { EquityPoint, Interval } from './types.js';
import type { WalkForwardResult } from './engine/walkforward.js';

const WIDTH = 74;

export function rule(char = '─'): string {
  return char.repeat(WIDTH);
}

export function heading(text: string): string {
  return `\n${text}\n${rule()}`;
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(30)}${value}`;
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
    row(tradeStats ? 'Round trips' : 'Fills', String(m.trades)),
    ...(tradeStats
      ? [
          row('Win rate', pct(m.winRate)),
          row('Profit factor', formatRatio(m.profitFactor)),
          row('Fees + slippage paid', formatMoney(m.feesPaid)),
          row('Turnover (x equity/yr)', m.annualTurnover.toFixed(1)),
          row('Cost drag per year', pct(m.annualFeeDrag)),
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

  const execution = result.execution;
  if (execution.worstParticipation > 0) {
    parts.push('');
    parts.push(row('Average slippage paid', `${execution.averageSlippageBps.toFixed(1)} bps`));
    parts.push(row('Cost of own market impact', formatMoney(execution.impactCost)));
    parts.push(row('Largest share of a bar', pct(execution.worstParticipation)));
    if (execution.worstParticipation > 0.05) {
      parts.push(
        `  ${wrap(
          `At least one order was ${pct(execution.worstParticipation)} of a bar's entire ` +
            `volume. The square-root impact model is being extrapolated well past where ` +
            `it was ever fitted, so the real fill would be worse than this — probably ` +
            `much worse. This size is not tradeable in this market.`,
          WIDTH - 4,
        )}`,
      );
    }
    if (execution.cappedFills > 0) {
      parts.push(
        `  ${wrap(
          `${execution.cappedFills} fills hit the impact ceiling, meaning the model ` +
            `wanted to charge more than it was allowed to. Those fills are understated.`,
          WIDTH - 4,
        )}`,
      );
    }
  } else if (!execution.volumeAvailable) {
    parts.push('');
    parts.push(
      `  ${wrap(
        'This series carries no volume, so market impact could not be modelled at all: ' +
          'the slippage above is the spread only, and a large order is priced exactly ' +
          'like a small one. That is the optimistic assumption.',
        WIDTH - 4,
      )}`,
    );
  }

  const drag = result.commissionDrag;
  if (drag.perRoundTrip > 0.001) {
    parts.push('');
    parts.push(
      row(
        'Commission per round trip',
        `${pct(drag.perRoundTrip)} of a ${drag.atNotional.toFixed(0)} position`,
      ),
    );
  }

  if (result.stops) {
    parts.push('');
    const fired = Object.entries(result.stops.byReason).filter(([, n]) => n > 0);
    if (fired.length === 0) {
      parts.push('  Protective exits were configured and never fired.');
    } else {
      parts.push('  Protective exits:');
      for (const [reason, count] of fired) {
        parts.push(`    ${String(count).padStart(6)}  ${reason}`);
      }
      parts.push(row('  average gap past the stop', pct(result.stops.averageSlippagePastTrigger)));
      parts.push(row('  worst gap past the stop', pct(result.stops.worstSlippagePastTrigger)));
      if (result.stops.worstSlippagePastTrigger > 0) {
        parts.push(
          `  ${wrap(
            'A stop becomes a market order when it is touched, so a market that gapped ' +
              'past it fills wherever it reopened. A backtest that fills every stop at ' +
              'the stop price reports those two lines as zero, and hides exactly the ' +
              'losses a stop cannot protect you from.',
            WIDTH - 4,
          )}`,
        );
      }
    }
  }

  const blocked = Object.entries(result.blocked).filter(([, n]) => n > 0);
  if (blocked.length > 0) {
    parts.push('');
    parts.push('  Bars the risk layer held back:');
    for (const [reason, count] of blocked.sort((a, b) => b[1] - a[1])) {
      parts.push(`    ${String(count).padStart(6)}  ${reason}`);
    }
  }

  parts.push(renderRobustness(result));

  const warnings = caveats(result.metrics);
  if (warnings.length > 0) {
    parts.push(heading('Read this before believing the table above'));
    for (const warning of warnings) {
      parts.push(`  - ${wrap(warning, WIDTH - 4)}`);
    }
  }

  return parts.join('\n');
}

/**
 * How long this equity curve would have to run before its Sharpe ratio could be
 * told apart from zero. Shared by the single-asset and portfolio reports, because
 * the question does not change with the number of instruments.
 */
export function renderTrackRecord(
  curve: readonly EquityPoint[],
  sharpeAnnual: number,
  interval: Interval,
): string {
  const parts: string[] = [];
  const returns: number[] = [];
  for (let i = 1; i < curve.length; i += 1) {
    const previous = curve[i - 1]?.equity ?? 0;
    const current = curve[i]?.equity ?? 0;
    if (previous > 0) returns.push(current / previous - 1);
  }

  const required = minimumTrackRecordLength({ returns, sharpeAnnual, interval });

  if (required.hopeless) {
    parts.push(
      `  ${wrap(
        'The measured edge is zero or negative, so no length of track record would ' +
          'establish one. There is nothing here to forward-test.',
        WIDTH - 4,
      )}`,
    );
    return parts.join('\n');
  }

  parts.push(row('Track record needed (95%)', `${Math.ceil(required.bars)} bars`));
  parts.push(row('  which is', formatDuration(required.days)));
  parts.push(
    `  ${wrap(
      'That is how long this strategy would have to run before its Sharpe ratio ' +
        'could be told apart from zero at 95% confidence. Required length goes with ' +
        'the inverse square of the edge, so half the Sharpe needs four times the ' +
        'evidence — and a finer bar size does not shorten it by a day. It is also the ' +
        'honest answer to "how long should I paper trade".',
      WIDTH - 4,
    )}`,
  );
  return parts.join('\n');
}

/**
 * Two questions the table above cannot answer: how long until you would know, and
 * how bad does the ride get.
 */
export function renderRobustness(result: BacktestResult): string {
  const parts: string[] = [heading('How long until you would know, and how bad it gets')];
  parts.push(renderTrackRecord(result.curve, result.metrics.sharpe, result.interval));

  if (result.trades.length >= 5) {
    const shuffled = bootstrapDrawdowns({
      trades: result.trades,
      startingEquity: result.metrics.startEquity,
    });
    parts.push('');
    parts.push(row('Drawdown history dealt', pct(result.metrics.maxDrawdown)));
    parts.push(row('Reshuffled: median', pct(shuffled.median)));
    parts.push(row('Reshuffled: 1 in 4 beyond', pct(shuffled.p75)));
    parts.push(row('Reshuffled: 1 in 20 beyond', pct(shuffled.p95)));
    parts.push(row('Reshuffled: worst of 1000', pct(shuffled.worst)));
    parts.push(row('Orderings that lost money', pct(shuffled.losingShare)));
    parts.push(
      `  ${wrap(
        'Same trades, different order, a thousand times. The drawdown the backtest ' +
          'reported is one sample from this, and three losses in a row instead of ' +
          'spread out is the difference between a bad month and switching the bot off ' +
          `at the bottom. Plan for the ${pct(shuffled.p75)} figure, not the ` +
          `${pct(result.metrics.maxDrawdown)} one, and decide now whether you would sit ` +
          'through it.',
        WIDTH - 4,
      )}`,
    );
  }

  return parts.join('\n');
}

/** Days as something a human plans around. */
export function formatDuration(days: number): string {
  if (!Number.isFinite(days)) return 'longer than any plan';
  if (days < 90) return `${Math.ceil(days)} days`;
  if (days < 730) return `${(days / 30.44).toFixed(1)} months`;
  return `${(days / 365).toFixed(1)} years`;
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
  parts.push(
    `  ${result.embargoBars} bars were withheld between each training and test window, ` +
      `so the two`,
  );
  parts.push('  do not overlap through the strategy\u2019s own lookback.');
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

export function renderPortfolio(result: PortfolioResult): string {
  const parts: string[] = [];
  parts.push(heading(`Portfolio backtest: ${result.strategy}`));
  parts.push(`  ${result.describe}`);
  parts.push(`  ${result.symbols.length} symbols: ${result.symbols.join(', ')}`);
  const first = result.curve[0];
  const last = result.curve[result.curve.length - 1];
  if (first && last) {
    parts.push(
      `  ${result.curve.length} aligned bars of ${result.interval}, ` +
        `${formatDate(first.time)} to ${formatDate(last.time)}`,
    );
  }
  parts.push(`  average positions held: ${result.averagePositions.toFixed(2)}`);
  parts.push('');
  parts.push(renderMetrics(result.metrics, { tradeStats: false }));
  parts.push(row('Fees + slippage paid', formatMoney(result.metrics.feesPaid)));
  parts.push(row('Turnover (x equity/yr)', result.metrics.annualTurnover.toFixed(1)));

  const traded = Object.entries(result.tradedBySymbol)
    .filter(([, notional]) => notional > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = traded.reduce((s, [, n]) => s + n, 0);
  if (traded.length > 0) {
    parts.push('');
    parts.push('  Share of notional traded, by symbol:');
    for (const [symbol, notional] of traded) {
      const share = total === 0 ? 0 : notional / total;
      const bar = '█'.repeat(Math.max(1, Math.round(share * 30)));
      parts.push(`    ${symbol.padEnd(12)}${pct(share).padStart(8)}  ${bar}`);
    }
  }

  if (result.droppedBars > 0) {
    parts.push('');
    parts.push(
      `  ${wrap(
        `${result.droppedBars} timestamps were dropped because at least one symbol had ` +
          `no bar there. They are not forward-filled: an invented price is one a ` +
          `strategy will happily trade against.`,
        WIDTH - 4,
      )}`,
    );
  }

  if (result.lateListings.length > 0) {
    parts.push('');
    parts.push('  Symbols that listed after the universe began, shortening the test:');
    for (const listing of result.lateListings.slice(0, 6)) {
      parts.push(`    ${listing.symbol.padEnd(12)}from ${formatDate(listing.firstTime)}`);
    }
  }

  if (result.killSwitch) {
    parts.push('');
    parts.push(`  Kill switch fired: ${result.killSwitch}`);
  }

  parts.push(heading('How long until you would know'));
  parts.push(renderTrackRecord(result.curve, result.metrics.sharpe, result.interval));

  parts.push(heading('Read this before believing the table above'));
  parts.push(`  - ${wrap(survivorshipWarning(result.symbols), WIDTH - 4)}`);
  for (const warning of caveats(result.metrics)) {
    parts.push(`  - ${wrap(warning, WIDTH - 4)}`);
  }
  parts.push(
    `  - ${wrap(
      'The benchmark here is an equal-weight hold of this same universe, not a ' +
        'single coin. Beating one coin by picking a different one is not a strategy.',
      WIDTH - 4,
    )}`,
  );

  return parts.join('\n');
}

export function renderPortfolioWalkForward(result: PortfolioWalkForwardResult): string {
  const parts: string[] = [heading('Portfolio walk-forward (out-of-sample only)')];
  parts.push(`  ${result.symbols.length} symbols: ${result.symbols.join(', ')}`);
  parts.push('');
  parts.push(
    `  ${'fold'.padEnd(6)}${'test window'.padEnd(28)}${'in-sample'.padStart(11)}` +
      `${'out-of-sample'.padStart(15)}${'sharpe'.padStart(9)}${'fills'.padStart(7)}`,
  );
  for (const fold of result.folds) {
    parts.push(
      `  ${String(fold.index).padEnd(6)}` +
        `${`${formatDate(fold.testFrom)} → ${formatDate(fold.testTo)}`.slice(0, 27).padEnd(28)}` +
        `${pct(fold.inSampleReturn).padStart(11)}${pct(fold.outOfSampleReturn).padStart(15)}` +
        `${formatRatio(fold.outOfSampleSharpe).padStart(9)}` +
        `${String(fold.outOfSampleFills).padStart(7)}`,
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
  return parts.join('\n');
}

export function renderCorrelation(report: CorrelationReport): string {
  const parts: string[] = [heading('How much diversification is actually here')];
  parts.push(`  ${report.symbols.length} symbols over ${report.observations} aligned bars`);
  parts.push('');
  parts.push(row('Average pairwise correlation', report.averagePairwise.toFixed(3)));
  if (report.highestPair) {
    parts.push(
      row(
        'Most correlated pair',
        `${report.highestPair.a}/${report.highestPair.b} ${report.highestPair.rho.toFixed(3)}`,
      ),
    );
  }
  if (report.lowestPair) {
    parts.push(
      row(
        'Least correlated pair',
        `${report.lowestPair.a}/${report.lowestPair.b} ${report.lowestPair.rho.toFixed(3)}`,
      ),
    );
  }
  parts.push(
    row('Effective independent bets', `${report.effectiveBets.toFixed(2)} of ${report.symbols.length}`),
  );
  parts.push('');
  parts.push(
    `  ${wrap(
      `Holding ${report.symbols.length} of these carries about as much independent risk ` +
        `as holding ${report.effectiveBets.toFixed(1)}. "Scans 50 markets simultaneously" is ` +
        `a claim about CPU, not about risk: in a basket this correlated, every position ` +
        `is the same position wearing a different ticker, and they all draw down together ` +
        `on the day it matters.`,
      WIDTH - 4,
    )}`,
  );

  if (report.symbols.length <= 12) {
    parts.push('');
    parts.push(`  ${''.padEnd(10)}${report.symbols.map((s) => s.slice(0, 6).padStart(7)).join('')}`);
    for (const [i, symbol] of report.symbols.entries()) {
      const cells = (report.matrix[i] as number[])
        .map((rho) => rho.toFixed(2).padStart(7))
        .join('');
      parts.push(`  ${symbol.slice(0, 9).padEnd(10)}${cells}`);
    }
  }

  return parts.join('\n');
}

export function renderSignificance(result: SignificanceResult, interval: string): string {
  const d = result.deflated;
  const parts: string[] = [heading('Is the best configuration actually significant?')];
  parts.push(
    `  ${'configuration'.padEnd(34)}${'sharpe'.padStart(9)}${'return'.padStart(11)}${'trades'.padStart(8)}`,
  );
  for (const trial of result.trials) {
    parts.push(
      `  ${trial.name.slice(0, 33).padEnd(34)}${formatRatio(trial.sharpe).padStart(9)}` +
        `${pct(trial.totalReturn).padStart(11)}${String(trial.trades).padStart(8)}`,
    );
  }
  parts.push('');
  parts.push(row('Configurations searched', String(d.trials)));
  parts.push(row(`Winner's Sharpe (annual, ${interval})`, formatRatio(result.winnerSharpeAnnual)));
  parts.push(row("Winner's Sharpe (per bar)", d.observedSharpe.toFixed(4)));
  parts.push(row('Hurdle from the search alone', d.selectionHurdle.toFixed(4)));
  parts.push(row('Deflated Sharpe probability', d.probability.toFixed(3)));
  parts.push(row('Verdict', d.verdict));
  parts.push('');
  parts.push(
    `  ${wrap(
      d.probability >= 0.95
        ? `The winner clears the hurdle its own parameter search creates. That is the ` +
            `minimum standard for reporting a Sharpe ratio at all — now check it out of ` +
            `sample with walkforward, because significance in-sample is not persistence.`
        : `Searching ${d.trials} configurations and keeping the best inflates the Sharpe ` +
            `ratio even when none of them has an edge. Deflated for that search, for the ` +
            `length of the series and for the fat tails of these returns, this result is ` +
            `${d.verdict}. Report this number, not the raw Sharpe.`,
      WIDTH - 4,
    )}`,
  );
  return parts.join('\n');
}

export function renderPortfolioNoise(
  result: PortfolioNoiseResult,
  realExcess: number | null,
): string {
  const parts: string[] = [heading('What this strategy does on universes with no momentum in them')];
  parts.push(
    `  ${result.runs} generated universes, correlated like crypto majors, with the ` +
      `relative-strength`,
  );
  parts.push('  persistence set to zero — there is nothing in them to rotate into.');
  parts.push('');
  parts.push(row('Beat equal-weight hold', `${result.beatBenchmark} of ${result.runs} runs`));
  parts.push(row('Median excess return', pct(result.medianExcess)));
  parts.push(row('Worst excess return', pct(result.excessReturns[0] ?? 0)));
  parts.push(
    row('Best excess return', pct(result.excessReturns[result.excessReturns.length - 1] ?? 0)),
  );
  parts.push(row('95th percentile Sharpe', formatRatio(result.p95Sharpe)));
  if (realExcess !== null) {
    parts.push('');
    parts.push(row('On your universe', pct(realExcess)));
  }
  parts.push('');
  const hitRate = result.runs === 0 ? 0 : result.beatBenchmark / result.runs;
  parts.push(
    `  ${wrap(
      `Concentrating into a few of many volatile, correlated assets produces an ` +
        `enormous spread of outcomes, and the good half looks like skill. Here the ` +
        `strategy beat a plain equal-weight hold in ${pct(hitRate)} of universes that ` +
        `contain no edge at all, with the best run up ${pct(
          result.excessReturns[result.excessReturns.length - 1] ?? 0,
        )}. One good backtest is a draw from this distribution. Judge a single result ` +
        `against the spread, never on its own.`,
      WIDTH - 4,
    )}`,
  );
  return parts.join('\n');
}
