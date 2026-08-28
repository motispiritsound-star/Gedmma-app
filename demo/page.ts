/**
 * Zet demo/out/demo-data.json om in een losse HTML-pagina die zonder server
 * werkt: demo/out/demo.html. De gegevens komen uit een echte scan; deze stap
 * knipt weg wat de pagina niet toont en bakt de kaartmodule en de mailsjablonen
 * mee, zodat de demo dezelfde teksten genereert als het dashboard.
 *
 *   node demo/build.ts && node demo/page.ts
 */
process.removeAllListeners('warning');

import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import { magBellen, magMailen } from '../src/db/contact.ts';

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
  agentId: lead.toegewezen_aan,
  klantStatus: lead.klant_status,
  maandbedragCent: lead.maandbedrag_cent,
  rechtsvorm: lead.rechtsvorm,
  geblokkeerd: lead.geblokkeerd,
  geblokkeerdReden: lead.geblokkeerd_reden,
  belToestemming: lead.bel_toestemming,
  // Met dezelfde functie als de server, zodat de demo geen eigen oordeel verzint.
  bellen: magBellen(lead),
  mailen: magMailen(lead),
  score: lead.score,
  grade: lead.grade,
  oordeel: lead.verdict?.label ?? '',
  status: lead.scan_status,
  fout: lead.error,
  contact: lead.contact,
  voorgesteldSjabloon: lead.voorgesteldSjabloon,
  // De sjablonen worden in de pagina zelf gerenderd; daarvoor is het oordeel
  // nodig plus de twee dingen die de teksten uit de meting halen.
  verdict: lead.verdict,
  signals: lead.signals ? { totalMs: lead.signals.totalMs, tech: lead.signals.tech } : null,
  feiten: feitenVan(lead),
}));

const verdeling = ['A', 'B', 'C', 'D', 'F'].map((grade) => ({
  grade, aantal: leads.filter((lead) => lead.grade === grade).length,
}));

const FASE_LABELS: Record<string, string> = {
  nieuw: 'Nieuw', toegewezen: 'Toegewezen', gebeld: 'Gebeld', geen_gehoor: 'Geen gehoor',
  afspraak: 'Afspraak', opdracht: 'Opdracht binnen', in_aanbouw: 'In aanbouw', live: 'Live',
  klant: 'Klant', afgewezen: 'Afgewezen',
};
const MIJLPAAL = 'opdracht';
const VANAF_OPDRACHT = ['opdracht', 'in_aanbouw', 'live', 'klant'];

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
    opdrachten: leads.filter((lead) => VANAF_OPDRACHT.includes(lead.fase)).length,
    magBellen: leads.filter((lead) => lead.bellen.mag).length,
    alleenMailen: leads.filter((lead) => !lead.bellen.mag && lead.mailen.mag).length,
    klanten: klanten.length,
    mrrCent: klanten.reduce((som, lead) => som + (lead.maandbedragCent ?? 0), 0),
  },
  verdeling,
  trechter,
  faseLabels: FASE_LABELS,
  mijlpaal: MIJLPAAL,
  leads: leads.sort((a, b) => (a.score ?? 0) - (b.score ?? 0)),
};

/** Zet een TypeScript-module om in gewone JS die in de pagina kan staan. */
function naarBrowserJs(pad: string): string {
  const uitvoer = ts.transpileModule(readFileSync(pad, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: false },
    fileName: pad,
  });
  // In de pagina staat alles in één module-script; de export-woorden kunnen weg.
  return uitvoer.outputText.replace(/^export /gm, '');
}

const kaartJs = readFileSync('src/server/public/kaart.js', 'utf8').replace(/^export /gm, '');
const sjabloonJs = naarBrowserJs('src/report/templates.ts');
const omtrek = readFileSync('src/server/public/nederland.json', 'utf8');

const template = readFileSync('demo/template.html', 'utf8');
const html = template
  .replace('/*__KAART_JS__*/', kaartJs)
  .replace('/*__SJABLONEN_JS__*/', sjabloonJs)
  .replace('"__NL_OMTREK__"', omtrek)
  .replace('"__DEMO_DATA__"', JSON.stringify(data));

writeFileSync('demo/out/demo.html', html);
console.log(`demo/out/demo.html geschreven (${Math.round(html.length / 1024)} kB, ${leads.length} bedrijven)`);
