import { checkRobots } from './robots.ts';
import { fetchPage, exists } from './fetcher.ts';
import { analyzePage, type PageSignals } from './analyze.ts';
import { deepScan, type DeepMetrics } from './deep.ts';
import { scoreSignals, offlineVerdict, type Verdict } from '../score/score.ts';
import { saveScan, type CompanyRow } from '../db/index.ts';
import { pool } from '../util/pool.ts';
import { progress, log } from '../util/log.ts';
import { config } from '../config.ts';

export type ScanReport = {
  signals: PageSignals | null;
  verdict: Verdict;
  deep: DeepMetrics | null;
  extra: { hasSitemap: boolean; hasRobotsTxt: boolean };
};

export type ScanOutcome = {
  company: CompanyRow;
  status: 'ok' | 'error' | 'blocked' | 'offline';
  score: number | null;
  grade: string | null;
  finalUrl: string | null;
  httpStatus: number | null;
  error: string | null;
  report: ScanReport | { error: string };
};

export type ScanOptions = {
  deep?: boolean;
  screenshotDir?: string;
  concurrency?: number;
  /** Negeer robots.txt niet — dit schakelt alleen de extra sitemap/robots-checks uit. */
  skipExtras?: boolean;
};

/** Scant één website en levert een beoordeling op. Schrijft niets weg. */
export async function scanCompany(company: CompanyRow, options: ScanOptions = {}): Promise<ScanOutcome> {
  const base = {
    company, score: null as number | null, grade: null as string | null,
    finalUrl: null as string | null, httpStatus: null as number | null,
  };

  const robots = await checkRobots(company.website).catch(() => ({ allowed: true, crawlDelayMs: 0 }));
  if (!robots.allowed) {
    return {
      ...base, status: 'blocked',
      error: 'robots.txt verbiedt het scannen van deze pagina',
      report: { error: 'geblokkeerd door robots.txt' },
    };
  }

  const fetched = await fetchPage(company.website, { crawlDelayMs: robots.crawlDelayMs });

  if (fetched.error || fetched.status === null) {
    const reason = fetched.error ?? 'onbekende fout';
    const verdict = offlineVerdict(reason);
    return {
      ...base, status: 'offline', score: verdict.score, grade: verdict.grade,
      finalUrl: fetched.finalUrl, httpStatus: null, error: reason,
      report: { signals: null, verdict, deep: null, extra: { hasSitemap: false, hasRobotsTxt: false } },
    };
  }

  if (fetched.status >= 400) {
    const reason = `HTTP ${fetched.status}`;
    const verdict = offlineVerdict(reason);
    return {
      ...base, status: 'error', score: verdict.score, grade: verdict.grade,
      finalUrl: fetched.finalUrl, httpStatus: fetched.status, error: reason,
      report: { signals: null, verdict, deep: null, extra: { hasSitemap: false, hasRobotsTxt: false } },
    };
  }

  const signals = analyzePage(fetched);
  const verdict = scoreSignals(signals);

  const origin = new URL(fetched.finalUrl).origin;
  const extra = options.skipExtras
    ? { hasSitemap: false, hasRobotsTxt: false }
    : {
        hasSitemap: await exists(`${origin}/sitemap.xml`),
        hasRobotsTxt: await exists(`${origin}/robots.txt`),
      };

  const deep = options.deep
    ? await deepScan(fetched.finalUrl, { screenshotDir: options.screenshotDir, mobile: true })
    : null;

  return {
    company,
    status: 'ok',
    score: verdict.score,
    grade: verdict.grade,
    finalUrl: fetched.finalUrl,
    httpStatus: fetched.status,
    error: null,
    report: { signals, verdict, deep, extra },
  };
}

/** Scant een lijst bedrijven parallel en slaat elk resultaat direct op. */
export async function scanAll(companies: CompanyRow[], options: ScanOptions = {}): Promise<ScanOutcome[]> {
  if (companies.length === 0) {
    log.warn('Geen bedrijven om te scannen.');
    return [];
  }
  const bar = progress(companies.length, 'gescand');
  const outcomes: ScanOutcome[] = [];

  await pool(
    companies,
    options.concurrency ?? config.concurrency,
    (company) => scanCompany(company, options),
    (result, company) => {
      const outcome: ScanOutcome = result ?? {
        company, status: 'error', score: null, grade: null, finalUrl: null,
        httpStatus: null, error: 'scan mislukt', report: { error: 'scan mislukt' },
      };
      outcomes.push(outcome);
      saveScan(company.id, {
        status: outcome.status,
        score: outcome.score,
        grade: outcome.grade,
        finalUrl: outcome.finalUrl,
        httpStatus: outcome.httpStatus,
        error: outcome.error,
        report: outcome.report,
      });
      bar.tick(`${outcome.grade ?? '-'} ${company.domain}`);
    },
  );

  bar.done();
  return outcomes;
}
