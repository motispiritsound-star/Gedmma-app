import type { Verdict } from '../score/score.ts';
import type { PageSignals } from '../scan/analyze.ts';

export type PitchInput = {
  companyName: string;
  domain: string;
  city?: string | null;
  verdict: Verdict;
  signals: PageSignals | null;
  /** Jouw eigen gegevens, komen in de ondertekening. */
  sender?: { name?: string; company?: string; phone?: string; email?: string };
};

const IMPACT: Record<string, string> = {
  'geen-https': 'Bezoekers krijgen in Chrome de melding "Niet veilig" te zien voordat ze iets van u gelezen hebben.',
  'tls-fout': 'Browsers tonen nu een volledige waarschuwingspagina; veel bezoekers klikken dan direct weg.',
  'geen-viewport': 'Ruim twee derde van uw bezoekers komt via de telefoon — die haken hier vrijwel allemaal af.',
  'niet-responsive': 'Op een telefoon moet de bezoeker in- en uitzoomen om iets te kunnen lezen.',
  'verouderde-opmaak': 'De site oogt daardoor jaren ouder dan uw bedrijf in werkelijkheid is.',
  'verouderde-tech': 'Dit is niet alleen traag, het is ook het gat waar websites via gehackt worden.',
  'zeer-traag': 'Google laat trage sites structureel lager zien in de zoekresultaten.',
  'traag': 'Elke seconde extra laadtijd kost gemiddeld rond de 7% van de aanvragen.',
  'geen-titel': 'In Google staat nu geen wervende titel, alleen uw domeinnaam.',
  'geen-omschrijving': 'Google verzint zelf het tekstje onder uw zoekresultaat.',
  'geen-structured-data': 'Uw openingstijden en adres verschijnen daardoor niet in Google.',
  'parkeerpagina': 'Wie u opzoekt, vindt geen werkende website.',
  'onbereikbaar': 'De website was tijdens onze controle helemaal niet te bereiken.',
  'geen-contactgegevens': 'Bezoekers moeten zoeken naar een manier om contact op te nemen.',
  'geen-contactformulier': 'Er is geen laagdrempelige manier om een offerte aan te vragen.',
  'verouderde-inhoud': 'Bezoekers twijfelen of het bedrijf nog actief is.',
  'weinig-inhoud': 'Google heeft te weinig tekst om uw site op te laten vinden.',
};

/** Korte, feitelijke opsomming van wat er mis is — bruikbaar in een mail of rapport. */
export function issueLines(verdict: Verdict, max = 5): string[] {
  return verdict.topIssues.slice(0, max).map((found) => {
    const impact = IMPACT[found.id];
    return impact ? `${found.title}. ${impact}` : `${found.title}.`;
  });
}

const opening = (verdict: Verdict): string => {
  if (verdict.grade === 'F') return 'daar vielen een paar dingen op die u waarschijnlijk klanten kosten';
  if (verdict.grade === 'D') return 'daar zag ik een aantal punten die relatief eenvoudig een stuk beter kunnen';
  return 'daar zag ik een paar punten die beter kunnen';
};

/** Genereert een concept-mail voor de koude benadering. Altijd zelf nalezen voor je verstuurt. */
export function buildEmail(input: PitchInput): { subject: string; body: string } {
  const { companyName, domain, verdict, sender } = input;
  const name = sender?.name ?? '[jouw naam]';
  const company = sender?.company ?? '[jouw bedrijf]';
  const contact = [sender?.phone, sender?.email].filter(Boolean).join(' · ') || '[telefoon] · [e-mail]';

  const subject = verdict.grade === 'F'
    ? `Een paar verbeterpunten op ${domain}`
    : `Kort punt over de website van ${companyName}`;

  const bullets = issueLines(verdict).map((line) => `• ${line}`).join('\n');

  const body = `Beste ${companyName},

Ik kwam uw website ${domain} tegen en heb hem kort bekeken — ${opening(verdict)}:

${bullets}

Ik help ondernemers in de omgeving${input.city ? ` van ${input.city}` : ''} met precies dit soort dingen. Mijn voorstel: ik pak deze punten kosteloos voor u op en zet de vernieuwde website op mijn eigen hosting. U zit nergens aan vast en betaalt vooraf niets. Als het u niets oplevert, stopt het daar.

Wat ik van u nodig heb is een halfuurtje om te horen wat uw klanten belangrijk vinden. Ik laat u dan eerst een voorbeeld zien voordat er iets live gaat.

Schikt het als ik u deze week even bel?

Met vriendelijke groet,
${name}
${company}
${contact}

PS: wilt u liever geen berichten meer van mij ontvangen, dan hoor ik dat graag — ik haal u dan direct uit mijn lijst.`;

  return { subject, body };
}

/** Uitgebreider rapport in Markdown, bijvoorbeeld als bijlage bij de mail. */
export function buildReport(input: PitchInput): string {
  const { companyName, domain, verdict, signals } = input;
  const lines: string[] = [
    `# Websitescan ${companyName}`,
    '',
    `**Website:** ${domain}  `,
    `**Totaalscore:** ${verdict.score}/100 (${verdict.grade} — ${verdict.label})  `,
    `**Datum:** ${new Date().toLocaleDateString('nl-NL')}`,
    '',
    '## Scores per onderdeel',
    '',
    '| Onderdeel | Score |',
    '| --- | --- |',
    ...verdict.categories.map((c) => `| ${c.label} | ${c.score}/${c.max} |`),
    '',
    '## Gevonden verbeterpunten',
    '',
  ];

  const bySeverity = ['kritiek', 'hoog', 'middel', 'laag'] as const;
  for (const severity of bySeverity) {
    const found = verdict.issues.filter((entry) => entry.severity === severity);
    if (found.length === 0) continue;
    lines.push(`### ${severity[0]!.toUpperCase()}${severity.slice(1)}`, '');
    for (const entry of found) {
      lines.push(`- **${entry.title}**  `, `  _Aanpak:_ ${entry.advies}${entry.detail ? `  _(${entry.detail})_` : ''}`);
    }
    lines.push('');
  }

  if (signals) {
    lines.push(
      '## Technische gegevens', '',
      `- Laadtijd homepage: ${signals.totalMs ?? '?'} ms (server reageert na ${signals.ttfbMs ?? '?'} ms)`,
      `- Paginagrootte: ${Math.round(signals.bytes / 1000)} kB`,
      `- Platform: ${signals.tech.map((t) => `${t.name}${t.version ? ` ${t.version}` : ''}`).join(', ') || signals.generator || 'onbekend'}`,
      `- Afbeeldingen: ${signals.images.total} (${signals.images.missingAlt} zonder alt-tekst)`,
      '',
    );
  }

  lines.push(
    '---',
    '',
    'Deze scan is geautomatiseerd uitgevoerd op de openbaar toegankelijke homepage.',
    'Aan de uitkomsten kunnen geen rechten worden ontleend.',
  );
  return lines.join('\n');
}
