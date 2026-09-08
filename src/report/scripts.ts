/**
 * Belscripts en bezwaren.
 *
 * De mailsjablonen openen het gesprek; dit is wat je zegt als iemand opneemt of
 * terugbelt. Geen tekst om voor te lezen — een structuur met de zinnen die
 * werken, gevuld met wat de scan bij dít bedrijf gevonden heeft.
 *
 * De toon is overal dezelfde: je belt niet om iets te verkopen, je belt omdat je
 * iets zag. Dat is ook letterlijk waar, en het is het enige verschil tussen dit
 * gesprek en het vijfde telemarketinggesprek dat die ondernemer deze week krijgt.
 */
import type { Verdict } from '../score/score.ts';
import type { PageSignals } from '../scan/analyze.ts';

export type ScriptContext = {
  bedrijf: string;
  domein: string;
  plaats?: string | null;
  verdict: Verdict;
  signals: PageSignals | null;
  /** De zin die je aanbod uitlegt; komt uit de instellingen. */
  aanbod?: string;
  afzender?: { naam?: string; bedrijf?: string };
  /** Mag je bellen? Zo niet, dan is er maar één script: toestemming vragen. */
  magBellen?: boolean;
};

export type Scriptdeel = {
  kop: string;
  /** Wat je zegt. Elke regel is een adem, geen alinea. */
  regels: string[];
  /** Waarom het zo staat — voor de agent, niet voor de klant. */
  waarom?: string;
};

export type Bezwaar = {
  wat: string;
  antwoord: string[];
  waarom: string;
};

const naam = (ctx: ScriptContext) => ctx.afzender?.naam?.trim() || '[jouw naam]';
const eigenBedrijf = (ctx: ScriptContext) => ctx.afzender?.bedrijf?.trim() || '[jouw bedrijf]';

/**
 * Het meest zichtbare probleem, in de taal van de ondernemer. De zin komt na
 * "ik zag dat ...", dus hij staat in de bijzin: werkwoord achteraan.
 */
function pijn(ctx: ScriptContext): string {
  const heeft = (id: string) => ctx.verdict.issues.some((kwestie) => kwestie.id === id);
  if (heeft('onbereikbaar') || heeft('parkeerpagina')) return 'uw website op dit moment niet te bereiken is';
  if (heeft('geen-viewport') || heeft('niet-responsive')) return 'uw site niet goed werkt op een telefoon';
  if (heeft('geen-https') || heeft('tls-fout')) return 'bezoekers "Niet veilig" te zien krijgen in de adresbalk';
  if (heeft('zeer-traag') || heeft('traag')) {
    const ms = ctx.signals?.totalMs;
    return ms
      ? `uw site er ${(ms / 1000).toFixed(1)} seconden over doet om te laden`
      : 'uw site traag laadt';
  }
  if (heeft('verouderde-tech')) return 'uw site op software draait die niet meer wordt bijgewerkt';
  const eerste = ctx.verdict.topIssues[0]?.title;
  return eerste ? `${eerste.charAt(0).toLowerCase()}${eerste.slice(1)}` : 'er wat te verbeteren valt aan uw site';
}

/** Het gevolg dat een ondernemer herkent, zonder cijfers die je niet kunt waarmaken. */
function gevolg(ctx: ScriptContext): string {
  const heeft = (id: string) => ctx.verdict.issues.some((kwestie) => kwestie.id === id);
  if (heeft('onbereikbaar') || heeft('parkeerpagina')) return 'wie u opzoekt, vindt niets';
  if (heeft('geen-viewport') || heeft('niet-responsive')) return 'en de meeste mensen zoeken u op hun telefoon op';
  if (heeft('geen-https') || heeft('tls-fout')) return 'dat is het eerste wat ze zien, nog voor uw naam';
  if (heeft('zeer-traag') || heeft('traag')) return 'de meeste mensen wachten dat niet af';
  return 'dat kost u aanvragen zonder dat u het merkt';
}

export function belscript(ctx: ScriptContext): Scriptdeel[] {
  const plaats = ctx.plaats ? ` hier in ${ctx.plaats}` : '';

  if (ctx.magBellen === false) {
    return [{
      kop: 'Bellen mag hier niet',
      regels: [
        'Dit bedrijf is een eenmanszaak, vof, maatschap of cv — of de rechtsvorm is onbekend.',
        'Sinds 1 juli 2026 mag je die alleen bellen met vooraf gegeven, aantoonbare toestemming.',
        'Stuur het sjabloon "Toestemming vragen" en leg het antwoord vast bij de lead.',
        'Zodra dat vastligt, kleurt de belknop groen en staat dit script hier klaar.',
      ],
      waarom: 'De boete loopt tot € 900.000 en de bewijslast ligt bij jou. Het is het niet waard.',
    }];
  }

  return [
    {
      kop: 'De opening — vijftien seconden',
      regels: [
        `Goedemiddag, u spreekt met ${naam(ctx)} van ${eigenBedrijf(ctx)}.`,
        `Ik bel over de website van ${ctx.bedrijf}${plaats} — heb ik u even?`,
        '(wacht op antwoord; niet doorpraten)',
        `Ik zag namelijk dat ${pijn(ctx)}, ${gevolg(ctx)}.`,
      ],
      waarom: 'Je noemt zijn bedrijf en één concreet ding. Dat is het verschil met een verkoper: '
        + 'je hebt gekeken. Praat je door de stilte heen, dan word je alsnog een verkoper.',
    },
    {
      kop: 'De vraag die het gesprek opent',
      regels: [
        'Wist u dat, of ben ik de eerste die het zegt?',
        '(luister — hier hoor je of hij het al wist, geen tijd had, of niemand heeft die het doet)',
        'En krijgt u er eigenlijk klanten via binnen, of loopt het vooral via mond-tot-mond?',
      ],
      waarom: 'Twee open vragen, en je weet of dit een lead is. Wie zegt "dat ding doet toch niets" '
        + 'heeft je al verteld waarom hij nooit geld aan die site uitgeeft — en waarom jouw voorstel wél past.',
    },
    {
      kop: 'Het aanbod — kort',
      regels: [
        ctx.aanbod?.trim()
          || 'Mijn voorstel is simpel: ik bouw uw website kosteloos opnieuw op en zet hem op onze eigen hosting. '
            + 'U betaalt vooraf niets en zit nergens aan vast.',
        'U ziet het resultaat eerst, en pas daarna beslist u.',
        'Ik heb een halfuurtje van u nodig om te horen wat uw klanten belangrijk vinden.',
      ],
      waarom: 'Geen prijslijst, geen pakketten. Eén zin over wat hij krijgt, één over wat hij riskeert (niets), '
        + 'één over wat je van hem vraagt.',
    },
    {
      kop: 'Afsluiten met een datum',
      regels: [
        'Schikt donderdagochtend, of komt vrijdag beter uit?',
        '(twee keuzes, geen ja/nee-vraag)',
        'Prima — ik stuur u nu meteen een mail met wat ik precies gezien heb, dan heeft u het zwart-op-wit.',
      ],
      waarom: 'Zet de afspraak meteen in het dashboard bij de lead. Een afspraak die alleen in je hoofd zit, '
        + 'staat morgen niet op je werklijst.',
    },
  ];
}

export const BEZWAREN: Bezwaar[] = [
  {
    wat: 'Ik heb al een website',
    antwoord: [
      'Dat klopt, en daar bel ik ook over — niet om er een tweede naast te zetten.',
      'De site die er staat doet op dit moment een paar dingen niet meer die Google en telefoons wél verwachten.',
      'Ik bouw hem opnieuw op zoals hij nu hoort te werken. U hoeft niets te veranderen aan wat u doet.',
    ],
    waarom: 'Hij hoort "je hebt iets nodig dat je niet hebt". Draai het om: je verbetert wat er al is.',
  },
  {
    wat: 'Wat kost het?',
    antwoord: [
      'De herbouw kost u niets. U betaalt pas iets als de site live staat en u tevreden bent.',
      'Daarna is het [maandbedrag] per maand voor de hosting, het onderhoud en kleine wijzigingen.',
      'Geen contract — u kunt maandelijks stoppen en u krijgt alle bestanden mee.',
    ],
    waarom: 'Noem het bedrag zonder aarzeling. Wie eromheen draait, klinkt alsof hij zich schaamt voor de prijs.',
  },
  {
    wat: 'Waarom doet u dat gratis? Wat is de vangst?',
    antwoord: [
      'Eerlijk antwoord: ik verdien aan de hosting, niet aan de bouw.',
      'Als de site goed is, blijft u. Is hij dat niet, dan bent u binnen een maand weg en heb ik voor niets gewerkt.',
      'Dat risico neem ik liever dan u vooraf duizend euro vragen voor iets dat u nog niet gezien heeft.',
    ],
    waarom: 'Deze vraag is een koopsignaal. Wie hem stelt, overweegt het. Wees volledig open over je model — '
      + 'elk ontwijkend antwoord bevestigt zijn vermoeden dat er een adder onder het gras zit.',
  },
  {
    wat: 'Ik heb er geen tijd voor',
    antwoord: [
      'Dat snap ik, daarom vraag ik ook maar één ding van u: een halfuurtje aan de telefoon.',
      'De rest doe ik. U krijgt een link, u kijkt ernaar, en u zegt wat er anders moet.',
      'Zal ik u die link sturen en volgende week even bellen?',
    ],
    waarom: '"Geen tijd" betekent meestal "ik zie niet wat het me oplevert". Maak het werk dat hij moet doen zo klein '
      + 'dat het antwoord niet meer over tijd gaat.',
  },
  {
    wat: 'Mijn neef / zwager doet mijn website',
    antwoord: [
      'Dan zit u goed, dat meen ik. Hoe snel kan hij er meestal iets aan doen als er iets moet veranderen?',
      '(luister — negen van de tien keer is het antwoord "als hij tijd heeft")',
      'Ik zou zeggen: laat hem vooral doen wat hij doet. Zal ik u toch mailen wat ik gezien heb, dan kan hij ermee verder?',
    ],
    waarom: 'Nooit tegen de neef praten. Je verliest van familie. Laat de vertraging het argument zijn, '
      + 'en geef de bevindingen weg — die mail komt later terug.',
  },
  {
    wat: 'Stuur maar een mail',
    antwoord: [
      'Doe ik. Naar welk adres mag ik het sturen — is dat [het adres op de site]?',
      'Ik zet erin wat ik precies gezien heb en wat ik zou doen. Mag ik u er volgende week even over bellen?',
      '(noteer de dag; zet hem meteen in het dashboard)',
    ],
    waarom: 'Dit is beleefd afscheid nemen, tenzij je er een moment aan hangt. Zonder afgesproken dag '
      + 'is de mail een archief, geen stap.',
  },
  {
    wat: 'Ik doe niets aan de telefoon',
    antwoord: [
      'Helemaal goed, dat begrijp ik.',
      'Ik stuur u de bevindingen per mail, dan kunt u het rustig bekijken wanneer het u uitkomt.',
      'Als u er niets mee wilt, hoor ik dat graag — dan haal ik u uit mijn lijst.',
    ],
    waarom: 'Meteen respecteren. En bied de afmelding zelf aan: dat kost je één lead en levert je '
      + 'een reputatie op die je in een klein werkgebied niet kunt kopen.',
  },
  {
    wat: 'Is dit AVG-proof / hoe komt u aan mijn gegevens?',
    antwoord: [
      'Uw bedrijfsgegevens staan openbaar op uw eigen website en in openbare bedrijfsregisters; daar heb ik ze vandaan.',
      'Ik heb uw site bekeken zoals elke bezoeker dat kan, en daar een korte analyse van gemaakt.',
      'Wilt u dat ik uw gegevens verwijder, dan doe ik dat direct en hoort u niets meer van mij.',
    ],
    waarom: 'Antwoord feitelijk en zonder verdediging. Doe wat je belooft: zet hem op de niet-benaderen-lijst '
      + 'terwijl je hem aan de lijn hebt.',
  },
];

/** Het hele script in platte tekst, om te printen of in de app te tonen. */
export function scriptTekst(ctx: ScriptContext): string {
  const delen = belscript(ctx).map((deel) =>
    `${deel.kop.toUpperCase()}\n${deel.regels.map((regel) => `  ${regel}`).join('\n')}`
    + (deel.waarom ? `\n  → ${deel.waarom}` : ''));
  return `Belscript · ${ctx.bedrijf} (${ctx.domein})\n\n${delen.join('\n\n')}`;
}
