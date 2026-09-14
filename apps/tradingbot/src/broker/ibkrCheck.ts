import { IbkrError, type IbkrClient } from './ibkrClient.js';
import { isPaperAccount } from './ibkrExecution.js';

/**
 * Walk every endpoint the bot depends on, in order, and report what came back.
 *
 * This exists because of an honest gap. The IBKR client was written against
 * Interactive Brokers' published documentation, and no request from this
 * repository has ever reached a real gateway — the environment it was built in
 * blocks outbound connections entirely. Every endpoint path, every field name and
 * every response shape is therefore an assumption.
 *
 * Assumptions of that kind fail quietly, which is the dangerous part. A field
 * renamed from `netliquidationvalue` to something else does not raise: `Number(
 * undefined)` is `NaN`, the guard turns it into `0`, and a bot reads its account
 * equity as zero and sits there doing nothing while looking healthy. So rather
 * than trusting the typed methods, this asks for the raw body at each step and
 * checks that the specific fields the client reads are actually present.
 *
 * The output is meant to be pasted back verbatim when something fails. Each step
 * names the endpoint, what was expected, and what arrived.
 */

export type StepStatus = 'pass' | 'warn' | 'fail' | 'skipped';

export interface CheckStep {
  name: string;
  endpoint: string;
  status: StepStatus;
  detail: string;
  /** What the client reads from this response, and whether each was found. */
  fields?: { name: string; found: boolean; value?: string }[];
  /** A trimmed view of the raw body, shown when something did not line up. */
  raw?: string;
}

export interface CheckReport {
  steps: CheckStep[];
  /** Account IDs found, so the caller can suggest one. */
  accounts: string[];
  /** A contract ID resolved during the run, usable for the next command. */
  sampleConid: number | null;
  ok: boolean;
}

export interface CheckOptions {
  client: IbkrClient;
  /** Ticker to resolve and pull bars for. Something liquid and uncontroversial. */
  symbol?: string;
}

/** Keep a raw body readable in a terminal without losing what matters. */
function trim(value: unknown, limit = 400): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text === undefined) return 'undefined';
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function fieldsOf(
  record: Record<string, unknown> | undefined,
  names: readonly string[],
): { name: string; found: boolean; value?: string }[] {
  return names.map((name) => {
    const present = record !== undefined && record[name] !== undefined;
    return {
      name,
      found: present,
      value: present ? trim(record?.[name], 60) : undefined,
    };
  });
}

function describeError(error: unknown): string {
  if (error instanceof IbkrError) {
    return `${error.message}${error.body ? ` — ${trim(error.body, 200)}` : ''}`;
  }
  return error instanceof Error ? error.message : String(error);
}

export async function runConnectionCheck(options: CheckOptions): Promise<CheckReport> {
  const { client } = options;
  const symbol = (options.symbol ?? 'AAPL').toUpperCase();
  const steps: CheckStep[] = [];
  const accounts: string[] = [];
  let sampleConid: number | null = null;

  const add = (step: CheckStep): CheckStep => {
    steps.push(step);
    return step;
  };

  // 1. Is the gateway there, and is it logged in?
  let authenticated = false;
  try {
    const body = (await client.raw('POST', '/iserver/auth/status')) as Record<string, unknown>;
    authenticated = body.authenticated === true;
    const competing = body.competing === true;
    add({
      name: 'Gateway reachable and logged in',
      endpoint: 'POST /iserver/auth/status',
      status: authenticated ? (competing ? 'warn' : 'pass') : 'fail',
      detail: authenticated
        ? competing
          ? 'Logged in, but another session holds this login. Orders placed here would ' +
            'not reach the exchange. Log out of Client Portal or TWS elsewhere.'
          : 'Logged in.'
        : 'Reached the gateway but it is not logged in. Open its address in a browser ' +
          'and sign in, then run this again.',
      fields: fieldsOf(body, ['authenticated', 'connected', 'competing']),
      raw: authenticated ? undefined : trim(body),
    });
  } catch (error) {
    add({
      name: 'Gateway reachable and logged in',
      endpoint: 'POST /iserver/auth/status',
      status: 'fail',
      detail: describeError(error),
    });
    return { steps, accounts, sampleConid, ok: false };
  }

  if (!authenticated) return { steps, accounts, sampleConid, ok: false };

  // 2. Which accounts can this login act for?
  let accountId: string | null = null;
  try {
    const body = (await client.raw('GET', '/portfolio/accounts')) as unknown;
    const rows = Array.isArray(body) ? body : [];
    for (const row of rows) {
      const record = row as Record<string, unknown>;
      const id = record.accountId ?? record.id;
      if (typeof id === 'string') accounts.push(id);
    }
    accountId = accounts.find((id) => isPaperAccount(id)) ?? accounts[0] ?? null;
    add({
      name: 'Accounts listed',
      endpoint: 'GET /portfolio/accounts',
      status: accounts.length > 0 ? 'pass' : 'fail',
      detail:
        accounts.length > 0
          ? `${accounts.length} found: ${accounts
              .map((id) => `${id} (${isPaperAccount(id) ? 'paper' : 'REAL MONEY'})`)
              .join(', ')}`
          : 'No account IDs in the response. The client reads `accountId` or `id` from ' +
            'each row; check the raw body below for what it actually contains.',
      fields: fieldsOf(rows[0] as Record<string, unknown> | undefined, ['accountId', 'id']),
      raw: accounts.length > 0 ? undefined : trim(body),
    });
  } catch (error) {
    add({
      name: 'Accounts listed',
      endpoint: 'GET /portfolio/accounts',
      status: 'fail',
      detail: describeError(error),
    });
  }

  // 3. The priming call that market data needs first.
  try {
    await client.raw('GET', '/iserver/accounts');
    add({
      name: 'Market data primed',
      endpoint: 'GET /iserver/accounts',
      status: 'pass',
      detail: 'Accepted. This call has to happen once before any market data request.',
    });
  } catch (error) {
    add({
      name: 'Market data primed',
      endpoint: 'GET /iserver/accounts',
      status: 'fail',
      detail: `${describeError(error)} — market data will fail with an unrelated-looking error until this works.`,
    });
  }

  // 4. Equity and cash, which is where a renamed field does the most damage.
  if (accountId !== null) {
    try {
      const body = (await client.raw(
        'GET',
        `/portfolio/${encodeURIComponent(accountId)}/ledger`,
      )) as Record<string, unknown>;
      const currencies = Object.keys(body);
      const first = (body.BASE ?? body[currencies[0] ?? '']) as Record<string, unknown> | undefined;
      const fields = fieldsOf(first, ['cashbalance', 'netliquidationvalue', 'netliquidation']);
      const readable =
        fields[0]?.found === true && (fields[1]?.found === true || fields[2]?.found === true);
      add({
        name: 'Account equity readable',
        endpoint: `GET /portfolio/${accountId}/ledger`,
        status: readable ? 'pass' : 'fail',
        detail: readable
          ? `Currencies: ${currencies.join(', ')}.`
          : 'The fields the client reads are not in this response. A missing field here ' +
            'does not raise — it reads as zero equity, and the bot then does nothing ' +
            'while looking healthy. This is the single most important line to get right.',
        fields,
        raw: readable ? undefined : trim(body),
      });
    } catch (error) {
      add({
        name: 'Account equity readable',
        endpoint: `GET /portfolio/${accountId}/ledger`,
        status: 'fail',
        detail: describeError(error),
      });
    }

    // 5. Positions, read the same way the adapter reads them.
    try {
      const body = (await client.raw(
        'GET',
        `/portfolio/${encodeURIComponent(accountId)}/positions/0`,
      )) as unknown;
      const rows = Array.isArray(body) ? body : [];
      add({
        name: 'Positions readable',
        endpoint: `GET /portfolio/${accountId}/positions/0`,
        status: Array.isArray(body) ? 'pass' : 'fail',
        detail: Array.isArray(body)
          ? rows.length === 0
            ? 'Empty, which is correct for an untouched account.'
            : `${rows.length} open.`
          : 'Expected an array of positions.',
        fields:
          rows.length > 0
            ? fieldsOf(rows[0] as Record<string, unknown>, ['conid', 'position', 'mktPrice'])
            : undefined,
        raw: Array.isArray(body) ? undefined : trim(body),
      });
    } catch (error) {
      add({
        name: 'Positions readable',
        endpoint: `GET /portfolio/${accountId}/positions/0`,
        status: 'fail',
        detail: describeError(error),
      });
    }
  } else {
    add({
      name: 'Account equity readable',
      endpoint: '/portfolio/{account}/ledger',
      status: 'skipped',
      detail: 'No account ID to try.',
    });
  }

  // 6. Resolve a ticker to a contract ID.
  try {
    const body = (await client.raw('POST', '/iserver/secdef/search', {
      symbol,
      name: false,
    })) as unknown;
    const rows = Array.isArray(body) ? body : [];
    const first = rows[0] as Record<string, unknown> | undefined;
    const conid = Number(first?.conid);
    if (Number.isFinite(conid) && conid > 0) sampleConid = conid;
    add({
      name: `Contract lookup for ${symbol}`,
      endpoint: 'POST /iserver/secdef/search',
      status: sampleConid !== null ? 'pass' : 'fail',
      detail:
        sampleConid !== null
          ? `${rows.length} matches, first conid ${sampleConid}.`
          : 'No usable conid. The client reads `conid` from each row.',
      fields: fieldsOf(first, ['conid', 'symbol', 'companyHeader', 'secType', 'currency']),
      raw: sampleConid !== null ? undefined : trim(body),
    });
  } catch (error) {
    add({
      name: `Contract lookup for ${symbol}`,
      endpoint: 'POST /iserver/secdef/search',
      status: 'fail',
      detail: describeError(error),
    });
  }

  // 7. Bars, which is what every backtest downstream depends on.
  if (sampleConid !== null) {
    try {
      const query = `conid=${sampleConid}&period=1m&bar=1d&outsideRth=false`;
      const body = (await client.raw(
        'GET',
        `/iserver/marketdata/history?${query}`,
      )) as Record<string, unknown>;
      const rows = Array.isArray(body.data) ? body.data : [];
      const first = rows[0] as Record<string, unknown> | undefined;
      const fields = fieldsOf(first, ['t', 'o', 'h', 'l', 'c', 'v']);
      const usable = rows.length > 0 && fields.slice(0, 5).every((f) => f.found);
      add({
        name: 'Historical bars readable',
        endpoint: 'GET /iserver/marketdata/history',
        status: usable ? 'pass' : 'fail',
        detail: usable
          ? `${rows.length} daily bars returned.`
          : rows.length === 0
            ? 'No bars. Usually a market-data permission problem rather than a code one: ' +
              'check which subscriptions the account actually has.'
            : 'Bars returned, but not with the field names the client reads.',
        fields,
        raw: usable ? undefined : trim(body),
      });
    } catch (error) {
      add({
        name: 'Historical bars readable',
        endpoint: 'GET /iserver/marketdata/history',
        status: 'fail',
        detail: describeError(error),
      });
    }
  } else {
    add({
      name: 'Historical bars readable',
      endpoint: 'GET /iserver/marketdata/history',
      status: 'skipped',
      detail: 'No contract ID to ask about.',
    });
  }

  const ok = steps.every((step) => step.status === 'pass' || step.status === 'skipped');
  return { steps, accounts, sampleConid, ok };
}
