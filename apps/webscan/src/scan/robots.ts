import { config } from '../config.ts';

type Rules = { allow: string[]; disallow: string[]; crawlDelayMs: number };

const cache = new Map<string, Rules | null>();
const PERMISSIVE: Rules = { allow: [], disallow: [], crawlDelayMs: 0 };

function parseRobots(text: string, agent: string): Rules {
  const rules: Rules = { allow: [], disallow: [], crawlDelayMs: 0 };
  const groups: { agents: string[]; allow: string[]; disallow: string[]; delay: number }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;

  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0]!.trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [], delay: 0 };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    if (!current) continue;
    lastWasAgent = false;
    if (field === 'disallow') current.disallow.push(value);
    else if (field === 'allow') current.allow.push(value);
    else if (field === 'crawl-delay') current.delay = Number(value) || 0;
  }

  const token = agent.toLowerCase();
  const specific = groups.find((group) => group.agents.some((name) => name !== '*' && token.includes(name)));
  const wildcard = groups.find((group) => group.agents.includes('*'));
  const chosen = specific ?? wildcard;
  if (!chosen) return rules;
  return { allow: chosen.allow, disallow: chosen.disallow, crawlDelayMs: chosen.delay * 1000 };
}

function matches(path: string, pattern: string): boolean {
  if (pattern === '') return false;
  const regex = new RegExp(
    '^' + pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\$$/, '$'),
  );
  return regex.test(path);
}

async function loadRobots(origin: string): Promise<Rules | null> {
  if (cache.has(origin)) return cache.get(origin)!;
  let rules: Rules | null = PERMISSIVE;
  try {
    const response = await fetch(`${origin}/robots.txt`, {
      headers: { 'user-agent': config.userAgent },
      redirect: 'follow',
      signal: AbortSignal.timeout(Math.min(config.timeoutMs, 8_000)),
    });
    if (response.ok) {
      const text = (await response.text()).slice(0, 200_000);
      rules = parseRobots(text, config.userAgent);
    } else {
      // 404/410 = geen robots.txt = alles toegestaan. 401/403 = afgeschermd: niet crawlen.
      rules = response.status === 401 || response.status === 403 ? null : PERMISSIVE;
    }
  } catch {
    rules = PERMISSIVE; // Onbereikbare robots.txt blokkeert de scan van de homepage niet.
  }
  cache.set(origin, rules);
  return rules;
}

export type RobotsVerdict = { allowed: boolean; crawlDelayMs: number; reason?: string };

/** Controleert of wij deze URL mogen ophalen volgens robots.txt. */
export async function checkRobots(target: string): Promise<RobotsVerdict> {
  const url = new URL(target);
  const rules = await loadRobots(url.origin);
  if (rules === null) return { allowed: false, crawlDelayMs: 0, reason: 'robots.txt is afgeschermd' };

  const path = url.pathname + url.search;
  const longest = (patterns: string[]): number =>
    patterns.filter((pattern) => matches(path, pattern)).reduce((max, p) => Math.max(max, p.length), -1);

  const allowLen = longest(rules.allow);
  const disallowLen = longest(rules.disallow);
  const blocked = disallowLen > -1 && disallowLen > allowLen;
  return {
    allowed: !blocked,
    crawlDelayMs: rules.crawlDelayMs,
    reason: blocked ? 'geblokkeerd door robots.txt' : undefined,
  };
}

export function resetRobotsCache(): void {
  cache.clear();
}
