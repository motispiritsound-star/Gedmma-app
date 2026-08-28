import { checkRobots } from './robots.ts';
import { fetchPage, exists, leesSitemap } from './fetcher.ts';
import { analyzePage, type PageSignals } from './analyze.ts';
import { leesContactpagina, samenvoegen, vulAanUitVerleden,
         type Contactgegevens, type Contactpagina } from './contactpagina.ts';
import { deepScan, type DeepMetrics } from './deep.ts';
import { scoreSignals, offlineVerdict, type Verdict } from '../score/score.ts';
import { beoordeelLeven, bepaalPrioriteit, type Leven, type Prioriteit, type SitemapInfo } from '../score/leven.ts';
import { laatsteContactgegevens, saveScan, type CompanyRow } from '../db/index.ts';
import { pool } from '../util/pool.ts';
import { progress, log } from '../util/log.ts';
import { config } from '../config.ts';

export type ScanReport = {
  signals: PageSignals | null;
  verdict: Verdict;
  leven: Leven;
  prioriteit: Prioriteit;
  /** Alles wat we aan contactgegevens hebben kunnen vinden, uit beide pagina's. */
  contact: Contactgegevens;
  contactpagina: Contactpagina | null;
  deep: DeepMetrics | null;
  extra: { sitemap: SitemapInfo; hasRobotsTxt: boolean };
};

export type ScanOutcome = {
  company: CompanyRow;
  status: 'ok' | 'error' | 'blocked' | 'offline';
  score: number | null;
  grade: string | null;
  leven: number | null;
  prioriteit: number | null;
  finalUrl: string | null;
  httpStatus: number | null;
  error: string | null;
  report: ScanReport | { error: string };
};

export type ScanOptions = {
  /** Haal ook de contactpagina op; dat is één extra verzoek per bedrijf. */
  contactpagina?: boolean;
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
    leven: null as number | null, prioriteit: null as number | null,
    finalUrl: null as string | null, httpStatus: null as number | null,
  };
  const geenSitemap: SitemapInfo = { aanwezig: false, laatstGewijzigd: null, aantalUrls: 0 };

  const robots = await checkRobots(company.website).catch(() => ({ allowed: true, crawlDelayMs: 0 }));
  if (!robots.allowed) {
    return {
      ...base, status: 'blocked',
      error: 'robots.txt verbiedt het scannen van deze pagina',
      report: { error: 'geblokkeerd door robots.txt' },
    };
  }

  const fetched = await fetchPage(company.website, { crawlDelayMs: robots.crawlDelayMs });

  const onbereikbaar = (status: 'offline' | 'error', reason: string, httpStatus: number | null): ScanOutcome => {
    const verdict = offlineVerdict(reason);
    const leven = beoordeelLeven(null);
    const prioriteit = bepaalPrioriteit({
      kwaliteit: verdict.score, leven, heeftTelefoon: Boolean(company.phone), heeftEmail: Boolean(company.email),
    });
    return {
      ...base, status, score: verdict.score, grade: verdict.grade,
      leven: leven.score, prioriteit: prioriteit.score,
      finalUrl: fetched.finalUrl, httpStatus, error: reason,
      report: {
        signals: null, verdict, leven, prioriteit,
        contact: vulAanUitVerleden(samenvoegen(null, null), laatsteContactgegevens(company.id)),
        contactpagina: null,
        deep: null, extra: { sitemap: geenSitemap, hasRobotsTxt: false },
      },
    };
  };

  if (fetched.error || fetched.status === null) return onbereikbaar('offline', fetched.error ?? 'onbekende fout', null);
  if (fetched.status >= 400) return onbereikbaar('error', `HTTP ${fetched.status}`, fetched.status);

  const signals = analyzePage(fetched);
  const verdict = scoreSignals(signals);

  const origin = new URL(fetched.finalUrl).origin;
  const extra = options.skipExtras
    ? { sitemap: geenSitemap, hasRobotsTxt: false }
    : {
        sitemap: await leesSitemap(origin),
        hasRobotsTxt: await exists(`${origin}/robots.txt`),
      };

  // Contactgegevens staan meestal op /contact, niet op de homepage.
  const contactpagina = options.contactpagina === false
    ? null
    : await leesContactpagina(signals, { crawlDelayMs: robots.crawlDelayMs }).catch(() => null);
  const contact = vulAanUitVerleden(samenvoegen(signals, contactpagina), laatsteContactgegevens(company.id));

  const leven = beoordeelLeven(signals, extra.sitemap);
  const prioriteit = bepaalPrioriteit({
    kwaliteit: verdict.score,
    leven,
    heeftTelefoon: contact.phones.length > 0 || Boolean(company.phone),
    heeftEmail: contact.emails.length > 0 || Boolean(company.email),
  });

  const deep = options.deep
    ? await deepScan(fetched.finalUrl, { screenshotDir: options.screenshotDir, mobile: true })
    : null;

  return {
    company,
    status: 'ok',
    score: verdict.score,
    grade: verdict.grade,
    leven: leven.score,
    prioriteit: prioriteit.score,
    finalUrl: fetched.finalUrl,
    httpStatus: fetched.status,
    error: null,
    report: { signals, verdict, leven, prioriteit, contact, contactpagina, deep, extra },
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
        company, status: 'error', score: null, grade: null, leven: null, prioriteit: null,
        finalUrl: null, httpStatus: null, error: 'scan mislukt', report: { error: 'scan mislukt' },
      };
      outcomes.push(outcome);
      saveScan(company.id, {
        status: outcome.status,
        score: outcome.score,
        grade: outcome.grade,
        leven: outcome.leven,
        prioriteit: outcome.prioriteit,
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
