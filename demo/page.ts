/**
 * Zet demo/out/demo-data.json om in een losse HTML-pagina die zonder server
 * werkt: demo/out/demo.html. De gegevens komen uit een echte scan; deze stap
 * knipt alleen weg wat de pagina niet toont.
 *
 *   node demo/build.ts && node demo/page.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

type RawLead = Record<string, any>;

const source = JSON.parse(readFileSync('demo/out/demo-data.json', 'utf8')) as {
  gegenereerdOp: string;
  samenvatting: Record<string, number>;
  leads: RawLead[];
};

const feitenVan = (lead: RawLead) => {
  const signals = lead.signals;
  if (!signals) return null;
  return {
    laadtijdMs: signals.totalMs,
    ttfbMs: signals.ttfbMs,
    kb: Math.round(signals.bytes / 1000),
    afbeeldingen: signals.images.total,
    zonderAlt: signals.images.missingAlt,
    woorden: signals.content.wordCount,
    titel: signals.meta.title || null,
    copyright: signals.freshness.copyrightYear,
    platform: signals.tech
      .filter((tech: any) => tech.name !== 'Webserver')
      .map((tech: any) => `${tech.name}${tech.version ? ` ${tech.version}` : ''}`),
    verouderd: signals.tech.filter((tech: any) => tech.staleness >= 2).map((tech: any) => tech.note ?? tech.name),
  };
};

const leads = source.leads.map((lead) => ({
  id: lead.id,
  naam: lead.name,
  domein: lead.domain,
  plaats: lead.city,
  branche: lead.branch,
  lat: lead.lat,
  lon: lead.lon,
  fase: lead.fase,
  agent: lead.agent_naam,
  klantStatus: lead.klant_status,
  maandbedragCent: lead.maandbedrag_cent,
  score: lead.score,
  grade: lead.grade,
  oordeel: lead.verdict?.label ?? '',
  status: lead.scan_status,
  fout: lead.error,
  contact: lead.contact,
  categorieen: lead.verdict?.categories ?? [],
  problemen: (lead.verdict?.issues ?? []).map((issue: any) => ({
    severity: issue.severity, title: issue.title, advies: issue.advies, detail: issue.detail ?? null,
  })),
  feiten: feitenVan(lead),
  pitch: { onderwerp: lead.pitch.subject, tekst: lead.pitch.body },
}));

const verdeling = ['A', 'B', 'C', 'D', 'F'].map((grade) => ({
  grade, aantal: leads.filter((lead) => lead.grade === grade).length,
}));

const FASE_LABELS: Record<string, string> = {
  nieuw: 'Nieuw', toegewezen: 'Toegewezen', gebeld: 'Gebeld', geen_gehoor: 'Geen gehoor',
  afspraak: 'Afspraak', akkoord: 'Akkoord', in_aanbouw: 'In aanbouw', live: 'Live',
  klant: 'Klant', afgewezen: 'Afgewezen',
};

const trechter = Object.entries(FASE_LABELS).map(([fase, label]) => ({
  fase, label, aantal: leads.filter((lead) => lead.fase === fase).length,
}));

const klanten = leads.filter((lead) => lead.klantStatus === 'actief');

const data = {
  gegenereerdOp: source.gegenereerdOp,
  samenvatting: {
    ...source.samenvatting,
    benaderbaar: leads.filter((lead) =>
      (lead.score ?? 100) < 55 && (lead.contact.emails.length > 0 || lead.contact.phones.length > 0)).length,
    klanten: klanten.length,
    mrrCent: klanten.reduce((som, lead) => som + (lead.maandbedragCent ?? 0), 0),
  },
  verdeling,
  trechter,
  faseLabels: FASE_LABELS,
  leads: leads.sort((a, b) => (a.score ?? 0) - (b.score ?? 0)),
};

// De kaartmodule en de landsomtrek gaan mee in de pagina: de demo werkt zonder server.
const kaartJs = readFileSync('src/server/public/kaart.js', 'utf8').replace(/^export /gm, '');
const omtrek = readFileSync('src/server/public/nederland.json', 'utf8');

const template = readFileSync('demo/template.html', 'utf8');
const html = template
  .replace('/*__KAART_JS__*/', kaartJs)
  .replace('"__NL_OMTREK__"', omtrek)
  .replace('"__DEMO_DATA__"', JSON.stringify(data));
writeFileSync('demo/out/demo.html', html);

console.log(`demo/out/demo.html geschreven (${Math.round(html.length / 1024)} kB, ${leads.length} bedrijven)`);
