/**
 * Het draaiboek in de app zelf.
 *
 * Een partner die het systeem krijgt, krijgt er geen handleiding bij die hij
 * toch niet leest. Hij krijgt een lijst met stappen die afvinkt terwijl hij
 * werkt, in dezelfde volgorde als waarin het werkt: eerst je aanbod scherp,
 * dan één gemeente, dan vijftig mails, dan pas opschalen.
 *
 * De voortgang staat per persoon in de database, zodat jij als eigenaar ziet
 * waar iemand blijft hangen. Wie na twee weken nog bij "eerste vijftig mails"
 * staat, heeft geen software nodig maar een gesprek.
 */
import { db } from './index.ts';

export type Stap = {
  id: string;
  fase: string;
  titel: string;
  uitleg: string;
  /** Het commando of de plek in het dashboard waar deze stap gebeurt. */
  hoe?: string;
};

export const STAPPEN: Stap[] = [
  // --- opzetten -------------------------------------------------------------
  { id: 'aanbod', fase: 'Opzetten', titel: 'Je aanbod staat scherp',
    uitleg: 'Bedrag per maand, wat erin zit, je bedrijfsnaam en telefoon. Dit komt letterlijk in elke mail; '
      + 'vul je het later in, dan staat er "[jouw bedrijf]" in de mails die je al verstuurd hebt.',
    hoe: 'Team & omzet → Wat je aanbiedt' },
  { id: 'doel', fase: 'Opzetten', titel: 'Je doel per maand staat vast',
    uitleg: 'Zonder doel is elke week hetzelfde. Met een doel rekent het dashboard uit hoeveel opdrachten '
      + 'je nog nodig hebt.',
    hoe: 'node start.js prognose --doel 500' },
  { id: 'controle', fase: 'Opzetten', titel: 'De controle staat op groen',
    uitleg: 'Herkenbare user-agent, eigen database, bedrijfsnaam ingevuld. Zolang hier iets rood staat, '
      + 'benader je nog niemand.',
    hoe: 'node start.js controle' },

  // --- eerste ronde ---------------------------------------------------------
  { id: 'eerste-ronde', fase: 'Eerste ronde', titel: 'Eén gemeente gescand',
    uitleg: 'Begin met een plaats die je kent. Herken je de drie slechtste sites, dan klopt het oordeel '
      + 'en kun je erop bouwen.',
    hoe: 'node start.js eerste-ronde --plaats "Jouw gemeente"' },
  { id: 'scores-getoetst', fase: 'Eerste ronde', titel: 'De scores getoetst aan je eigen oordeel',
    uitleg: 'Loop tien leads na. Vind je een score onterecht, pas dan de regels aan voordat je er honderd '
      + 'mails op baseert.',
    hoe: 'src/score/rules.ts' },

  // --- eerste klanten -------------------------------------------------------
  { id: 'eerste-mails', fase: 'Eerste klanten', titel: 'Je eerste vijftig mails verstuurd',
    uitleg: 'Filter op contactgegevens en "draait nog", sorteer op beste leads eerst. Lees elke mail na '
      + 'voordat hij weggaat.',
    hoe: 'Kaart & leads → filters → Mail opstellen' },
  { id: 'werklijst', fase: 'Eerste klanten', titel: 'Vijf dagen achter elkaar je werklijst leeggewerkt',
    uitleg: 'Hier valt het om. Niet bij het eerste contact maar bij het tweede: de herinnering na vier dagen '
      + 'levert meer op dan vijftig nieuwe leads.',
    hoe: 'Vandaag' },
  { id: 'eerste-gesprek', fase: 'Eerste klanten', titel: 'Je eerste echte gesprek gevoerd',
    uitleg: 'Gebruik het belscript bij de lead. Niet voorlezen — de opening en de twee vragen zijn wat telt.',
    hoe: 'Lead openen → Belscript' },
  { id: 'eerste-opdracht', fase: 'Eerste klanten', titel: 'Je eerste opdracht binnen',
    uitleg: 'De mijlpaal: je mag de site kosteloos herbouwen en hosten. Zet de lead op "Opdracht binnen".' },
  { id: 'eerste-live', fase: 'Eerste klanten', titel: 'De eerste site staat live op jouw hosting',
    uitleg: 'Vanaf hier loopt er geld binnen dat elke maand terugkomt.' },
  { id: 'eerste-testimonial', fase: 'Eerste klanten', titel: 'Je eerste testimonial vastgelegd',
    uitleg: 'Zet hem op "publiceerbaar" en elke koude mail neemt hem automatisch mee. Een tevreden ondernemer '
      + 'uit dezelfde streek overtuigt sterker dan welke belofte ook.',
    hoe: 'Lead openen → Testimonial' },

  // --- opschalen ------------------------------------------------------------
  { id: 'server', fase: 'Opschalen', titel: 'Het dashboard draait op een server',
    uitleg: 'Nodig zodra er iemand anders mee gaat werken. systemd, Caddy en het back-upscript staan klaar.',
    hoe: 'deploy/' },
  { id: 'eerste-partner', fase: 'Opschalen', titel: 'Je eerste partner werkt in zijn eigen gebied',
    uitleg: 'Pas als je zelf minstens één klant hebt. Anders leer je iemand een verhaal aan waarvan je niet '
      + 'weet of het werkt.',
    hoe: 'Team & omzet → Partners' },
  { id: 'tien-klanten', fase: 'Opschalen', titel: 'Tien betalende klanten',
    uitleg: 'Vanaf hier is het geen experiment meer. Reken uit wat je aankunt aan onderhoud voordat je '
      + 'de pijplijn verder opendraait.' },
];

export type StapMetStand = Stap & { gedaan: boolean; gedaanOp: string | null };

export function draaiboekVoor(gebruikerId: number): {
  stappen: StapMetStand[]; gedaan: number; totaal: number; volgende: StapMetStand | null;
} {
  const rijen = db().prepare('SELECT stap, gedaan_op FROM draaiboek WHERE gebruiker_id = ?')
    .all(gebruikerId) as unknown as { stap: string; gedaan_op: string }[];
  const gedaanOp = new Map(rijen.map((rij) => [rij.stap, rij.gedaan_op]));

  const stappen = STAPPEN.map((stap) => ({
    ...stap,
    gedaan: gedaanOp.has(stap.id),
    gedaanOp: gedaanOp.get(stap.id) ?? null,
  }));

  return {
    stappen,
    gedaan: stappen.filter((stap) => stap.gedaan).length,
    totaal: stappen.length,
    volgende: stappen.find((stap) => !stap.gedaan) ?? null,
  };
}

export function zetStap(gebruikerId: number, stap: string, gedaan: boolean): void {
  if (!STAPPEN.some((rij) => rij.id === stap)) throw new Error(`Onbekende stap "${stap}".`);
  if (gedaan) {
    db().prepare('INSERT OR IGNORE INTO draaiboek (gebruiker_id, stap) VALUES (?, ?)').run(gebruikerId, stap);
  } else {
    db().prepare('DELETE FROM draaiboek WHERE gebruiker_id = ? AND stap = ?').run(gebruikerId, stap);
  }
}

/** Hoe ver iedereen is — voor de eigenaar, om te zien wie vastloopt. */
export function voortgangPerPersoon(): { gebruikerId: number; naam: string; gedaan: number; totaal: number; volgende: string | null }[] {
  const mensen = db().prepare("SELECT id, naam FROM gebruikers WHERE actief = 1 ORDER BY naam")
    .all() as unknown as { id: number; naam: string }[];
  return mensen.map((mens) => {
    const stand = draaiboekVoor(mens.id);
    return {
      gebruikerId: mens.id, naam: mens.naam,
      gedaan: stand.gedaan, totaal: stand.totaal,
      volgende: stand.volgende?.titel ?? null,
    };
  });
}
