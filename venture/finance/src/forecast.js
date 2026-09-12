/**
 * Monthly forecast model.
 *
 * A forecast is not a prediction and this one does not pretend to be. It is an
 * arithmetic consequence of assumptions that are all stated, all labelled, and
 * all wrong to some degree. Its purpose is to answer "what would have to be true
 * for this to work, and how wrong can we be before it doesn't" — not to produce
 * a number for a business plan.
 *
 * The one thing it models carefully is the thing this business depends on:
 * subscribers accumulate across months, so revenue is a stock rather than a
 * flow. Getting that wrong in either direction changes the whole picture.
 */

import { computeOrderEconomics } from './economics.js';

/**
 * A grip refill has a better margin than the starter set — there is no bag in
 * it — but it still carries picking, postage and payment fees. 70% is an
 * ASSUMPTION, and after CAC it is the most sensitive input in the model.
 */
export const SUBSCRIPTION_CONTRIBUTION_MARGIN = 0.7;

/**
 * @typedef {object} ForecastAssumptions
 * @property {number} months
 * @property {number[]} adSpend            per month
 * @property {number} cac                  blended cost per acquired customer
 * @property {number} cacInflation         monthly multiplier, e.g. 1.02
 * @property {number} organicOrders        non-paid orders per month (clubs, referral, SEO)
 * @property {number} organicGrowth        monthly multiplier on organic
 * @property {number} subscriptionTakeRate share of new customers taking the grip subscription
 * @property {number} monthlyChurn         share of subscribers lost each month
 * @property {number} subscriptionValue    contribution per subscription renewal
 * @property {number} fixedMonthlyCost     platform, apps, tools, 3PL minimums
 */

/**
 * @param {import('./economics.js').OrderSpec} spec
 * @param {ForecastAssumptions} a
 */
export function forecast(spec, a) {
  const order = computeOrderEconomics(spec);
  const rows = [];

  let subscribers = 0;
  let cac = a.cac;
  let organic = a.organicOrders;
  let cumulativeProfit = 0;

  for (let month = 1; month <= a.months; month += 1) {
    const spend = a.adSpend[month - 1] ?? a.adSpend.at(-1) ?? 0;

    const paidOrders = cac > 0 ? spend / cac : 0;
    const newOrders = paidOrders + organic;

    // Subscribers churn first, then the new cohort joins. Doing it the other way
    // round flatters month one by exempting new joiners from churn.
    subscribers = subscribers * (1 - a.monthlyChurn);
    const newSubscribers = newOrders * a.subscriptionTakeRate;
    subscribers += newSubscribers;

    const acquisitionRevenue = newOrders * order.grossInclVat;
    const subscriptionRevenue = subscribers * a.subscriptionValue;

    const acquisitionContribution = newOrders * order.contributionBeforeAds;
    const subscriptionContribution =
      subscribers * a.subscriptionValue * SUBSCRIPTION_CONTRIBUTION_MARGIN;

    const contribution = acquisitionContribution + subscriptionContribution;
    const operatingProfit = contribution - spend - a.fixedMonthlyCost;
    cumulativeProfit += operatingProfit;

    rows.push({
      month,
      adSpend: spend,
      cac,
      paidOrders,
      organicOrders: organic,
      orders: newOrders,
      subscribers,
      revenue: acquisitionRevenue + subscriptionRevenue,
      contribution,
      operatingProfit,
      cumulativeProfit,
      // Marketing efficiency ratio: total revenue over total ad spend.
      mer: spend > 0 ? (acquisitionRevenue + subscriptionRevenue) / spend : Infinity,
    });

    cac *= a.cacInflation;
    organic *= a.organicGrowth;
  }

  return {
    rows,
    breakEvenMonth: rows.find((r) => r.operatingProfit > 0)?.month ?? null,
    cashTrough: Math.min(...rows.map((r) => r.cumulativeProfit)),
    finalCumulative: rows.at(-1).cumulativeProfit,
    orderContribution: order.contributionBeforeAds,
  };
}

/**
 * Budget scenarios. The purpose of the first budget is to buy information, not
 * revenue — so the lean case deliberately spends little and expects to learn
 * whether the thesis survives contact with real customers.
 */
export const BUDGET_SCENARIOS = {
  lean: {
    label: 'Lean validation',
    monthlyAdSpend: [300, 500, 800, 1000, 1200, 1500],
    purpose:
      'Buy information, not revenue. Enough spend to learn whether the offer converts and at what cost, ' +
      'and little enough that being wrong is survivable.',
  },
  standard: {
    label: 'Standard',
    monthlyAdSpend: [800, 1500, 2500, 3500, 4500, 6000],
    purpose: 'Validate and begin compounding, assuming the lean phase produced a working offer.',
  },
  accelerated: {
    label: 'Accelerated',
    monthlyAdSpend: [2000, 4000, 7000, 10000, 13000, 16000],
    purpose:
      'Only defensible AFTER contribution margin and repeat rate are measured rather than assumed. ' +
      'Spending at this level on modelled assumptions is gambling, not marketing.',
  },
};

/** Render a forecast as markdown. */
export function formatForecast(result, label) {
  const eur = (x) => x.toFixed(0);
  const lines = [
    `### ${label}`,
    '',
    '| Month | Ad spend | CAC | Orders | Subscribers | Revenue | Contribution | Operating profit | Cumulative |',
    '|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...result.rows.map(
      (r) =>
        `| ${r.month} | ${eur(r.adSpend)} | ${r.cac.toFixed(2)} | ${r.orders.toFixed(0)} | ` +
        `${r.subscribers.toFixed(0)} | ${eur(r.revenue)} | ${eur(r.contribution)} | ` +
        `${eur(r.operatingProfit)} | ${eur(r.cumulativeProfit)} |`,
    ),
    '',
    `First profitable month: **${result.breakEvenMonth ?? 'none within the horizon'}**  `,
    `Deepest cumulative position: **EUR ${result.cashTrough.toFixed(0)}** — this is the cash required, not the ad budget  `,
    `Cumulative at month ${result.rows.length}: **EUR ${result.finalCumulative.toFixed(0)}**`,
  ];
  return lines.join('\n');
}
