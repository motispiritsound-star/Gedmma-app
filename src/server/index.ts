import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { queryLeads, getLead, type LeadFilter } from '../report/leads.ts';
import { setOutreach, stats } from '../db/index.ts';
import { buildEmail, buildReport } from '../report/pitch.ts';
import { toCsv } from '../util/csv.ts';
import { log } from '../util/log.ts';

const here = dirname(fileURLToPath(import.meta.url));

const numberOr = (value: unknown, fallback?: number): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function filterFromQuery(query: Record<string, unknown>): LeadFilter {
  return {
    maxScore: numberOr(query.maxScore),
    minScore: numberOr(query.minScore),
    grade: (query.grade as string) || undefined,
    city: (query.city as string) || undefined,
    branch: (query.branch as string) || undefined,
    source: (query.source as string) || undefined,
    outreachStatus: (query.status as string) || undefined,
    metContact: query.metContact === '1' || query.metContact === 'true',
    includeOffline: query.includeOffline !== '0',
    search: (query.zoek as string) || undefined,
    sort: (query.sort as LeadFilter['sort']) || 'score',
    limit: numberOr(query.limit, 100),
    offset: numberOr(query.offset, 0),
  };
}

export async function startServer(port: number): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use(express.static(join(here, 'public')));

  app.get('/api/stats', (_req, res) => {
    res.json(stats());
  });

  app.get('/api/leads', (req, res) => {
    const filter = filterFromQuery(req.query as Record<string, unknown>);
    res.json({ leads: queryLeads(filter), filter });
  });

  app.get('/api/leads/:id', (req, res) => {
    const lead = getLead(Number(req.params.id));
    if (!lead) { res.status(404).json({ error: 'niet gevonden' }); return; }
    res.json(lead);
  });

  app.get('/api/leads/:id/pitch', (req, res) => {
    const lead = getLead(Number(req.params.id));
    if (!lead) { res.status(404).json({ error: 'niet gevonden' }); return; }

    const report = lead.report as { verdict?: any; signals?: any };
    if (!report?.verdict) { res.status(409).json({ error: 'nog geen scanresultaat' }); return; }

    const sender = {
      name: (req.query.naam as string) || undefined,
      company: (req.query.bedrijf as string) || undefined,
      phone: (req.query.telefoon as string) || undefined,
      email: (req.query.email as string) || undefined,
    };
    const input = {
      companyName: lead.name, domain: lead.domain, city: lead.city,
      verdict: report.verdict, signals: report.signals ?? null, sender,
    };
    res.json({ ...buildEmail(input), report: buildReport(input), to: lead.contact.emails[0] ?? null });
  });

  app.post('/api/leads/:id/status', (req, res) => {
    const { status, note } = req.body as { status?: string; note?: string };
    if (!status) { res.status(400).json({ error: 'status ontbreekt' }); return; }
    setOutreach(Number(req.params.id), status, note);
    res.json({ ok: true });
  });

  app.get('/api/export.csv', (req, res) => {
    const leads = queryLeads({ ...filterFromQuery(req.query as Record<string, unknown>), limit: 100_000, offset: 0 });
    const rows = leads.map((lead) => ({
      bedrijf: lead.name, website: lead.website, plaats: lead.city ?? '',
      score: lead.score ?? '', beoordeling: lead.grade ?? '',
      telefoon: lead.contact.phones.join(' / '), email: lead.contact.emails.join(' / '),
      belangrijkste_probleem: lead.topIssues[0]?.title ?? '', opvolging: lead.outreach_status,
    }));
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename="leads.csv"');
    res.send(toCsv(rows));
  });

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      log.ok(`Dashboard draait op http://localhost:${port}`);
      resolve();
    });
  });
}
