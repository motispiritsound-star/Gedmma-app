import type { Verdict } from '../score/score.ts';
import type { PageSignals } from '../scan/analyze.ts';

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

/** Korte, feitelijke opsomming van wat er mis is, met wat het de klant kost. */
export function issueLines(verdict: Verdict, max = 5): string[] {
  return verdict.topIssues.slice(0, max).map((gevonden) => {
    const gevolg = IMPACT[gevonden.id];
    return gevolg ? `${gevonden.title}. ${gevolg}` : `${gevonden.title}.`;
  });
}

export type Afzender = {
  naam?: string;
  bedrijf?: string;
  telefoon?: string;
  email?: string;
};

export type SjabloonContext = {
  bedrijf: string;
  domein: string;
  plaats?: string | null;
  verdict: Verdict;
  signals: PageSignals | null;
  afzender?: Afzender;
  /** De zin die je aanbod uitlegt; komt uit de instellingen. */
  aanbod?: string;
  /**
   * Bewijs dat je het al vaker deed. Niets hiervan wordt verzonnen: het komt uit
   * je eigen klanten en testimonials, en staat er alleen als je het echt hebt.
   * Een tevreden ondernemer uit dezelfde streek overtuigt sterker dan welke
   * belofte ook.
   */
  bewijs?: {
    klanten: number;
    testimonial?: { tekst: string; bedrijf: string; plaats?: string | null } | null;
  };
  /** Losse gegevens die sommige sjablonen invullen, bijvoorbeeld een afspraakdatum. */
  extra?: Record<string, string | undefined>;
};

export type Sjabloon = {
  id: string;
  naam: string;
  /** Wanneer je dit sjabloon gebruikt — staat als uitleg in het dashboard. */
  wanneer: string;
  /** De fase waar de lead na het versturen logischerwijs in komt. */
  naFase?: string;
  onderwerp(ctx: SjabloonContext): string;
  tekst(ctx: SjabloonContext): string;
};

// --- hulpjes ---------------------------------------------------------------

const naam = (ctx: SjabloonContext) => ctx.afzender?.naam?.trim() || '[jouw naam]';
const eigenBedrijf = (ctx: SjabloonContext) => ctx.afzender?.bedrijf?.trim() || '[jouw bedrijf]';

const ondertekening = (ctx: SjabloonContext): string => {
  const regels = [naam(ctx), eigenBedrijf(ctx)];
  const contact = [ctx.afzender?.telefoon?.trim(), ctx.afzender?.email?.trim()].filter(Boolean).join(' · ');
  regels.push(contact || '[telefoon] · [e-mail]');
  return `Met vriendelijke groet,\n${regels.join('\n')}`;
};

/** Verplichte afmeldregel bij koude benadering. */
const AFMELDEN = 'PS: wilt u liever geen berichten meer van mij ontvangen, dan hoor ik dat graag — ik haal u dan direct uit mijn lijst.';

const opsomming = (ctx: SjabloonContext, aantal = 4): string =>
  issueLines(ctx.verdict, aantal).map((regel) => `• ${regel}`).join('\n');

const kortePunten = (ctx: SjabloonContext, aantal = 3): string =>
  ctx.verdict.topIssues.slice(0, aantal).map((punt) => `• ${punt.title}`).join('\n');

const laadtijd = (ctx: SjabloonContext): string => {
  const ms = ctx.signals?.totalMs;
  return ms ? `${(ms / 1000).toFixed(1)} seconden` : 'meer dan gemiddeld';
};

const platform = (ctx: SjabloonContext): string => {
  const verouderd = ctx.signals?.tech.filter((tech) => tech.staleness >= 2) ?? [];
  if (verouderd.length === 0) return '';
  return verouderd.map((tech) => `${tech.name}${tech.version ? ` ${tech.version}` : ''}`).join(', ');
};

const plaatszin = (ctx: SjabloonContext) => ctx.plaats ? ` in ${ctx.plaats} en omgeving` : ' in de regio';

/**
 * De alinea met sociaal bewijs. Onder de drie klanten noemen we geen aantal —
 * "ik doe dit voor twee ondernemers" werkt tegen je — en zonder testimonial en
 * zonder klanten blijft de alinea gewoon weg.
 */
const bewijszin = (ctx: SjabloonContext): string => {
  const klanten = ctx.bewijs?.klanten ?? 0;
  const stem = ctx.bewijs?.testimonial;
  const delen: string[] = [];

  if (klanten >= 3) {
    delen.push(`Ik doe dit inmiddels voor ${klanten} ondernemers; hun sites draaien op onze hosting.`);
  }
  if (stem?.tekst) {
    const wie = [stem.bedrijf, stem.plaats].filter(Boolean).join(' uit ');
    delen.push(`${wie} zei erover: "${stem.tekst.trim().replace(/\s+/g, ' ')}"`);
  }
  return delen.join(' ');
};

/** Zet de bewijsalinea erbij als er iets te bewijzen valt, anders niets. */
const metBewijs = (ctx: SjabloonContext): string => {
  const zin = bewijszin(ctx);
  return zin ? `\n${zin}\n` : '';
};

// --- het aanbod, overal hetzelfde ------------------------------------------

const STANDAARD_AANBOD =
  'Mijn voorstel is simpel: ik bouw uw website kosteloos opnieuw op en zet hem op onze eigen hosting. ' +
  'U betaalt vooraf niets en zit nergens aan vast. Bevalt het niet, dan stopt het daar en houdt u gewoon uw huidige site.';

/** Het aanbod uit de instellingen, of het standaardaanbod als er niets is ingesteld. */
const aanbodVan = (ctx: SjabloonContext): string => ctx.aanbod?.trim() || STANDAARD_AANBOD;

// --- de sjablonen ----------------------------------------------------------

export const SJABLONEN: Sjabloon[] = [
  {
    id: 'eerste-contact',
    naam: 'Eerste contact',
    wanneer: 'Koude benadering per mail, met de bevindingen uit de scan.',
    naFase: 'gebeld',
    onderwerp: (ctx) => ctx.verdict.grade === 'F'
      ? `Een paar verbeterpunten op ${ctx.domein}`
      : `Kort punt over de website van ${ctx.bedrijf}`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik kwam uw website ${ctx.domein} tegen en heb hem kort bekeken. Een paar dingen vielen me op die u waarschijnlijk klanten kosten:

${opsomming(ctx)}

${aanbodVan(ctx)}
${metBewijs(ctx)}
Wat ik van u nodig heb is een halfuurtje om te horen wat uw klanten belangrijk vinden. Ik laat u eerst een voorbeeld zien voordat er iets live gaat.

Schikt het als ik u deze week even bel?

${ondertekening(ctx)}

${AFMELDEN}`,
  },

  {
    id: 'eerste-contact-kort',
    naam: 'Eerste contact — kort',
    wanneer: 'Voor ondernemers die weinig tijd hebben. Vier zinnen, één vraag.',
    naFase: 'gebeld',
    onderwerp: (ctx) => `${ctx.domein} — mag ik u iets laten zien?`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik zag drie dingen op ${ctx.domein} die u nu klanten kosten:

${kortePunten(ctx)}

Ik los ze kosteloos voor u op en zet de nieuwe site op onze hosting. Geen kosten vooraf, geen contract.
${metBewijs(ctx)}
Mag ik u bellen om het kort toe te lichten?

${ondertekening(ctx)}

${AFMELDEN}`,
  },

  {
    id: 'mobiel',
    naam: 'Insteek: mobiel',
    wanneer: 'Als de site niet werkt op een telefoon — vaak het overtuigendste argument.',
    naFase: 'gebeld',
    onderwerp: (ctx) => `${ctx.domein} op een telefoon`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik heb ${ctx.domein} even op mijn telefoon bekeken. Daar valt het meteen op: de site is gemaakt voor een computerscherm, dus een bezoeker moet in- en uitzoomen om iets te kunnen lezen of uw nummer te vinden.

Dat is geen detail. Het grootste deel van de mensen die u opzoekt doet dat op een telefoon, meestal op het moment dat ze u nodig hebben. Wie dan moet knijpen en slepen, gaat door naar de volgende in de lijst.

${aanbodVan(ctx)}

Zal ik u een voorbeeld sturen van hoe uw site er op een telefoon uit kan zien?

${ondertekening(ctx)}

${AFMELDEN}`,
  },

  {
    id: 'vindbaarheid',
    naam: 'Insteek: Google',
    wanneer: 'Als de site vooral op vindbaarheid slecht scoort.',
    naFase: 'gebeld',
    onderwerp: (ctx) => `${ctx.bedrijf} in Google`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Wie in Google zoekt naar wat u doet${plaatszin(ctx)}, komt u nu moeilijk tegen. Dat komt niet doordat u niet goed bent in uw vak, maar doordat uw website een paar dingen mist waar Google op let:

${opsomming(ctx, 4)}

Dat is grotendeels techniek en tekst, geen reclamebudget. ${aanbodVan(ctx)}

Zal ik u laten zien op welke zoekopdrachten u nu mist?

${ondertekening(ctx)}

${AFMELDEN}`,
  },

  {
    id: 'snelheid',
    naam: 'Insteek: snelheid',
    wanneer: 'Als de site traag is of technisch verouderd draait.',
    naFase: 'gebeld',
    onderwerp: (ctx) => `${ctx.domein} doet er ${laadtijd(ctx)} over`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik heb de laadtijd van ${ctx.domein} gemeten: de pagina doet er ${laadtijd(ctx)} over voordat een bezoeker iets ziet.${platform(ctx) ? `\n\nDe oorzaak zit in de techniek eronder — ik zag ${platform(ctx)} draaien. Dat is niet alleen traag, het is ook precies waar websites via gehackt worden.` : ''}

Bezoekers wachten dat niet af, en Google laat trage sites structureel lager zien.

${aanbodVan(ctx)} Op onze hosting draait uw site op moderne techniek die we bijhouden.

Mag ik u er deze week even over bellen?

${ondertekening(ctx)}

${AFMELDEN}`,
  },

  {
    id: 'website-offline',
    naam: 'Website is offline',
    wanneer: 'Als de site helemaal niet laadt of een foutmelding geeft.',
    naFase: 'gebeld',
    onderwerp: (ctx) => `Uw website ${ctx.domein} is op dit moment niet bereikbaar`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik wilde uw website ${ctx.domein} bekijken, maar die is op dit moment niet te bereiken.${ctx.verdict.issues[0] ? ` De melding die ik krijg: ${ctx.verdict.issues[0].title.toLowerCase()}.` : ''}

Ik weet niet of u daarvan op de hoogte bent — het gebeurt vaker dat het al een tijd zo staat zonder dat iemand het doorheeft. Wie u opzoekt, vindt intussen niets.

Ik kan twee dingen doen. Als u alleen wilt weten wat er mis is: dat zoek ik kosteloos voor u uit en dan hoort u het van me, zonder verplichting. Wilt u het meteen goed hebben, dan is dit mijn voorstel.

${aanbodVan(ctx)}

Zal ik u bellen?

${ondertekening(ctx)}

${AFMELDEN}`,
  },

  {
    id: 'toestemming-vragen',
    naam: 'Toestemming vragen om te bellen',
    wanneer: 'Voor eenmanszaken, vof\'s en zzp\'ers: bellen mag pas als zij ja zeggen.',
    onderwerp: (ctx) => `Mag ik u bellen over ${ctx.domein}?`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik heb uw website ${ctx.domein} bekeken en zag een paar dingen die u nu klanten kosten:

${kortePunten(ctx)}

Ik zou dat graag kort telefonisch toelichten — dat is in vijf minuten duidelijker dan in een lange mail. Maar ik bel u niet zomaar: sinds 1 juli 2026 mag dat alleen als u daar vooraf toestemming voor geeft.

Vandaar deze vraag. **Antwoordt u met "ja, u mag bellen", dan neem ik binnen een paar dagen contact op.** Reageert u niet, dan hoort u niets meer van mij per telefoon.

Liever meteen weten waar het over gaat? ${aanbodVan(ctx)}

${ondertekening(ctx)}

${AFMELDEN}`,
  },

  {
    id: 'geen-gehoor',
    naam: 'Na geen gehoor',
    wanneer: 'U hebt gebeld maar niemand bereikt.',
    onderwerp: (ctx) => `Geprobeerd te bellen — ${ctx.domein}`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik heb u vandaag geprobeerd te bellen, maar kreeg u niet te pakken. Daarom kort per mail.

Ik heb uw website bekeken en een paar punten gevonden die u nu klanten kosten:

${kortePunten(ctx)}

${aanbodVan(ctx)}

Als u me laat weten wanneer het u schikt, bel ik op dat moment terug. Antwoorden op deze mail mag ook.

${ondertekening(ctx)}`,
  },

  {
    id: 'na-gesprek',
    naam: 'Na het gesprek',
    wanneer: 'Bevestiging van wat u telefonisch hebt besproken.',
    naFase: 'afspraak',
    onderwerp: (ctx) => `Zoals besproken — de website van ${ctx.bedrijf}`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Dank voor het gesprek van zojuist. Zoals beloofd op een rij wat me op uw huidige site opviel:

${opsomming(ctx, 5)}

${aanbodVan(ctx)}

Wat er dan gebeurt:

1. Ik bouw een nieuwe versie en laat u die zien voordat er iets online staat.
2. Bent u tevreden, dan zetten we hem live op onze hosting. Uw domeinnaam blijft van u.
3. Daarna houd ik hem draaiend en up-to-date. Als u er later mee wilt stoppen, krijgt u alle bestanden mee.

Als u akkoord bent, hoor ik dat graag — dan plan ik het in.

${ondertekening(ctx)}`,
  },

  {
    id: 'rapport',
    naam: 'Rapport meesturen',
    wanneer: 'Stuur de volledige scan mee als bijlage of in de mail.',
    onderwerp: (ctx) => `Het volledige overzicht van ${ctx.domein}`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Hierbij het volledige overzicht van wat ik op ${ctx.domein} tegenkwam. De site scoort nu ${ctx.verdict.score} van de 100 punten.

Het zwaarst wegen deze punten:

${opsomming(ctx, 5)}

In het bijgevoegde rapport staat het volledige lijstje, per onderdeel, met bij elk punt wat eraan te doen is. U mag het gerust aan iemand anders laten zien — ook als u besluit het door een ander te laten oplossen.

${aanbodVan(ctx)}

${ondertekening(ctx)}`,
  },

  {
    id: 'laatste-poging',
    naam: 'Laatste bericht',
    wanneer: 'Beleefd afsluiten na twee of drie keer geen reactie.',
    naFase: 'afgewezen',
    onderwerp: (ctx) => `Laatste bericht over ${ctx.domein}`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Ik heb u een paar keer benaderd over uw website en niets van u gehoord. Dat is prima — u hebt genoeg aan uw hoofd, en dit is duidelijk niet waar u nu mee bezig bent.

Dit is mijn laatste bericht hierover. Het aanbod blijft staan: als u op enig moment wilt dat ik ernaar kijk, stuurt u me een berichtje. Mocht u het nooit meer willen horen, dan laat u dat weten en haal ik u uit mijn lijst.

Succes met de zaak.

${ondertekening(ctx)}`,
  },

  {
    id: 'opdracht-bevestigd',
    naam: 'Opdracht bevestigen',
    wanneer: 'Ze hebben ja gezegd. Bevestig de afspraak en vraag wat u nodig hebt.',
    naFase: 'opdracht',
    onderwerp: (ctx) => `Afgesproken — we gaan uw website vernieuwen`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Fijn dat we eruit zijn. Even zwart op wit wat we hebben afgesproken:

• Ik bouw de website van ${ctx.bedrijf} opnieuw op.
• ${aanbodVan(ctx)}
• De nieuwe site komt op onze hosting te staan; het onderhoud en de beveiliging doe ik.
• Uw domeinnaam ${ctx.domein} blijft op uw naam staan. U blijft er eigenaar van.
• U ziet de site eerst in een testomgeving. Pas als u akkoord bent, gaat hij live.
• Wilt u er later mee stoppen, dan krijgt u alle bestanden mee en verhuist u zonder gedoe.

Om te beginnen heb ik van u nodig:

1. Uw logo, als u dat hebt, in de beste kwaliteit die u kunt vinden.
2. Een paar foto's van uw werk, uw pand of uw team.
3. De teksten of gegevens die er zeker op moeten: diensten, werkgebied, openingstijden, contactgegevens.
4. De inloggegevens van uw domeinnaam, of de naam van de partij waar die staat.

Stuurt u wat u hebt; de rest verzin ik en leg ik u voor. Ik houd u op de hoogte zodra er iets te zien is.

${ondertekening(ctx)}`,
  },

  {
    id: 'site-live',
    naam: 'Site staat live',
    wanneer: 'De nieuwe site is live gegaan.',
    naFase: 'live',
    onderwerp: (ctx) => `Uw nieuwe website staat online`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Uw nieuwe website staat sinds vandaag online op ${ctx.domein}. Kijkt u vooral even rond, ook op uw telefoon.

Wat er is veranderd ten opzichte van de oude site:

${opsomming(ctx, 4)}

Dat is nu allemaal in orde. De site draait op onze hosting; updates en beveiliging houd ik bij, daar hebt u geen omkijken naar.

Ziet u iets wat anders moet — een foto, een tekst, openingstijden — dan stuurt u me een berichtje en pas ik het aan.

${ondertekening(ctx)}`,
  },

  {
    id: 'testimonial',
    naam: 'Om een testimonial vragen',
    wanneer: 'Een week of twee nadat de site live is en het bevalt.',
    onderwerp: (ctx) => `Mag ik u iets vragen?`,
    tekst: (ctx) => `Beste ${ctx.bedrijf},

Uw site staat nu een paar weken online. Ik hoop dat het bevalt — en ik ben benieuwd of u er iets van merkt: meer telefoontjes, meer aanvragen, of mensen die zeggen dat ze u online gevonden hebben.

Als u tevreden bent, wil ik u iets vragen. Ik werk voor een groot deel op basis van wat andere ondernemers over me zeggen. Zou u in twee of drie zinnen willen opschrijven hoe u het hebt ervaren? Wat u ook opschrijft is goed; ik pas er niets aan.

Antwoorden op deze mail is genoeg. Laat u me even weten of ik uw bedrijfsnaam erbij mag zetten?

En als er iets niet goed zit: zeg het me dan juist wel, dan los ik het op.

${ondertekening(ctx)}`,
  },
];

const OP_ID = new Map(SJABLONEN.map((sjabloon) => [sjabloon.id, sjabloon]));

export const sjabloon = (id: string): Sjabloon => {
  const gevonden = OP_ID.get(id);
  if (!gevonden) {
    throw new Error(`Onbekend sjabloon "${id}". Beschikbaar: ${SJABLONEN.map((s) => s.id).join(', ')}`);
  }
  return gevonden;
};

/**
 * Kiest het sjabloon dat het best past bij wat de scan gevonden heeft, zodat de
 * mail meteen over het zwaarste probleem gaat in plaats van over alles tegelijk.
 * Mag je het bedrijf niet bellen, dan is de eerste stap toestemming vragen.
 */
export function stelSjabloonVoor(verdict: Verdict, magBellen = true): string {
  if (!magBellen) return 'toestemming-vragen';
  const heeft = (id: string) => verdict.issues.some((kwestie) => kwestie.id === id);
  if (heeft('onbereikbaar') || heeft('parkeerpagina')) return 'website-offline';
  if (heeft('geen-viewport') || heeft('niet-responsive')) return 'mobiel';
  if (heeft('zeer-traag') || heeft('verouderde-tech')) return 'snelheid';

  const seo = verdict.categories.find((categorie) => categorie.category === 'vindbaarheid');
  if (seo && seo.lost > seo.max * 0.6) return 'vindbaarheid';
  return 'eerste-contact';
}

export type GerenderdeMail = {
  sjabloon: string;
  naam: string;
  onderwerp: string;
  tekst: string;
  /** Klaar om in een mailprogramma te openen. */
  mailto: string | null;
  naFase?: string;
};

export function renderSjabloon(id: string, ctx: SjabloonContext, aan?: string | null): GerenderdeMail {
  const gekozen = sjabloon(id);
  const onderwerp = gekozen.onderwerp(ctx);
  const tekst = gekozen.tekst(ctx);
  const mailto = aan
    ? `mailto:${encodeURIComponent(aan)}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`
    : null;
  return { sjabloon: gekozen.id, naam: gekozen.naam, onderwerp, tekst, mailto, naFase: gekozen.naFase };
}
