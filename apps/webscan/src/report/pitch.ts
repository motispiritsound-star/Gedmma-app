import type { Verdict } from '../score/score.ts';
import type { PageSignals } from '../scan/analyze.ts';

/**
 * Het uitgebreide rapport dat je als bijlage meestuurt. De mailteksten zelf
 * staan in templates.ts.
 */

export type PitchInput = {
  companyName: string;
  domain: string;
  city?: string | null;
  verdict: Verdict;
  signals: PageSignals | null;
};

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
