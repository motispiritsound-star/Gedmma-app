import type { Locale } from '@buurklus/shared';

/**
 * Website copy. Deliberately separate from the app's translation bundle: the
 * app labels controls, the site has to argue a case, and mixing the two makes
 * both worse. Dutch is written first and English is written as English, not as
 * a word-for-word rendering of the Dutch.
 */
export interface SiteCopy {
  meta: {
    title: string;
    description: string;
    proTitle: string;
    proDescription: string;
    ogLocale: string;
  };
  /** ctaShort is used below 560px, where the full label wraps to three lines. */
  nav: {
    trades: string;
    how: string;
    pros: string;
    cta: string;
    ctaShort: string;
    forCustomers: string;
    /** Label for the pricing link. Says nothing about a price, so it is true
        while the platform is free and still true once it is not. */
    pricing: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
  };
  proof: { trades: string; cities: string; free: string; verified: string };
  video: {
    title: string;
    subtitle: string;
    /** Read by a screen reader in place of the film. */
    alt: string;
    /** Says the English track is there and off unless asked for. */
    subtitlesNote: string;
    unsupported: string;
  };
  how: { title: string; subtitle: string; steps: { title: string; body: string }[] };
  trades: { title: string; subtitle: string; all: string; budgetFrom: string };
  cities: { title: string; subtitle: string; andMore: string };
  trust: { title: string; items: { title: string; body: string }[] };
  proTeaser: { title: string; body: string; cta: string; bullets: string[] };
  faq: { title: string; items: { q: string; a: string }[] };
  footer: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    links: { about: string; contact: string; terms: string; privacy: string; help: string };
    rights: string;
    languageLabel: string;
  };
  pro: {
    hero: { eyebrow: string; title: string; subtitle: string; cta: string; ctaShort: string; note: string };
    value: { title: string; items: { title: string; body: string }[] };
    pricing: {
      title: string;
      subtitle: string;
      monthly: string;
      yearly: string;
      perMonth: string;
      perYear: string;
      excludingVat: string;
      includingVat: string;
      quotes: string;
      trades: string;
      cities: string;
      citiesAll: string;
      headStart: string;
      noHeadStart: string;
      seats: string;
      choose: string;
      popular: string;
      vatNote: string;
      trialNote: string;
      /**
       * Shown instead of the price cards while nothing is for sale. Kept in
       * the same shape in both languages so the page cannot advertise a price
       * in one and a free platform in the other.
       */
      launch: {
        badge: string;
        title: string;
        cardTitle: string;
        subtitle: string;
        points: string[];
        laterTitle: string;
        later: string;
        cta: string;
      };
    };
    how: { title: string; steps: { title: string; body: string }[] };
    faq: { title: string; items: { q: string; a: string }[] };
  };
}

const nl: SiteCopy = {
  meta: {
    title: 'Buurklus — Vind een vakman bij je in de buurt',
    description:
      'Beschrijf je klus en ontvang tot 6 gratis offertes van vakmensen en bedrijven met een geverifieerd KvK-nummer. Gratis en vrijblijvend.',
    proTitle: 'Buurklus voor vakmensen — Ontvang klussen bij je in de buurt',
    proDescription:
      'Vul je agenda met klussen die bij je vakgebied en je werkgebied passen. Nu gratis, zonder abonnement en zonder commissie.',
    ogLocale: 'nl_NL',
  },
  nav: {
    trades: 'Vakgebieden',
    how: 'Hoe het werkt',
    pros: 'Voor vakmensen',
    cta: 'Klus plaatsen',
    ctaShort: 'Plaatsen',
    forCustomers: 'Je zoekt een vakman',
    pricing: 'Wat het kost',
  },
  hero: {
    eyebrow: 'Gratis voor particulieren',
    title: 'Vind een vakman bij je in de buurt',
    subtitle:
      'Beschrijf je klus in twee minuten. Vakmensen en bedrijven uit je eigen gemeente sturen je hun offerte. Jij vergelijkt en kiest.',
    primaryCta: 'Klus plaatsen',
    secondaryCta: 'Bekijk de vakgebieden',
    note: 'Vrijblijvend · Je gegevens gaan alleen naar de vakman die je kiest',
  },
  proof: {
    trades: 'vakgebieden',
    cities: 'gemeenten',
    free: 'gratis voor klanten',
    verified: 'bedrijven met KvK-controle',
  },
  video: {
    title: 'Zo werkt het, in 25 seconden',
    subtitle:
      'Van een woonkamer die geschilderd moet worden tot een vakman die je zelf hebt gekozen.',
    alt: 'Een animatie die laat zien hoe je een klus plaatst, offertes ontvangt en er één kiest.',
    subtitlesNote: 'Met geluid. Engelse ondertiteling kun je aanzetten in de spelerknoppen.',
    unsupported: 'Je browser kan deze video niet afspelen.',
  },
  how: {
    title: 'Hoe het werkt',
    subtitle: 'Drie stappen, en je hebt iets om te vergelijken.',
    steps: [
      {
        title: 'Beschrijf je klus',
        body: 'Het vakgebied, je gemeente, een paar foto’s als je die hebt. Twee minuten werk, en het kost niets.',
      },
      {
        title: 'Ontvang tot 6 offertes',
        body: 'Vakmensen uit je regio reageren met een prijs, een termijn en wat er inbegrepen zit. Meestal binnen 24 uur.',
      },
      {
        title: 'Kies met vertrouwen',
        body: 'Vergelijk prijs, beoordelingen en ervaring. Pas dan krijgt de vakman die je kiest je adres en telefoonnummer.',
      },
    ],
  },
  trades: {
    title: 'Van kleine reparatie tot complete verbouwing',
    subtitle: 'Alle bouw- en onderhoudsvakken, plus het verduurzamingswerk.',
    all: 'En nog veel meer',
    budgetFrom: 'vanaf',
  },
  cities: {
    title: 'In heel Nederland',
    subtitle: 'Van Groningen tot Maastricht, in de grote steden en de gemeenten daartussen.',
    andMore: 'en {{count}} andere gemeenten',
  },
  trust: {
    title: 'Waarom Buurklus',
    items: [
      {
        title: 'Bedrijven met een KvK-controle',
        body: 'Elke vakman geeft zijn KvK-nummer op. Dat register is openbaar, dus je kunt het zelf natrekken.',
      },
      {
        title: 'Beoordelingen die iets betekenen',
        body: 'Alleen een klant van wie de klus is afgerond kan beoordelen, en één keer. Geen gekochte sterren.',
      },
      {
        title: 'Je adres blijft privé',
        body: 'Tot je gekozen hebt zien vakmensen alleen je gemeente en je wijk. Niet je adres, niet je nummer.',
      },
      {
        title: 'Geen commissie',
        body: 'Buurklus pakt niets van je klus af. Je betaalt de vakman rechtstreeks, zoals jullie het samen afspreken.',
      },
    ],
  },
  proTeaser: {
    title: 'Ben je vakman of heb je een servicebedrijf?',
    body: 'Ontvang klussen die bij je vakgebied en je werkgebied passen, en vul je agenda zonder achter werk aan te bellen.',
    cta: 'Bekijk Buurklus voor vakmensen',
    bullets: [
      'Klussen van echte klanten bij je in de buurt',
      'Je reageert alleen als een klus je aanstaat',
      'Maandabonnement, geen commissie over je werk',
      '14 dagen gratis proberen, zonder betaalgegevens',
    ],
  },
  faq: {
    title: 'Veelgestelde vragen',
    items: [
      {
        q: 'Wat kost het voor een particulier?',
        a: 'Niets. Een klus plaatsen, offertes ontvangen en met vakmensen appen is helemaal gratis. De vakmensen nemen een abonnement.',
      },
      {
        q: 'Hoeveel offertes krijg ik?',
        a: 'Maximaal zes. Daarna sluit de klus voor nieuwe reacties, zodat je keuze overzichtelijk blijft.',
      },
      {
        q: 'Wie ziet mijn adres en telefoonnummer?',
        a: 'Alleen de vakman van wie je de offerte accepteert. Daarvoor zien de anderen je gemeente en je wijk, meer niet.',
      },
      {
        q: 'Hoe wordt de klus betaald?',
        a: 'Rechtstreeks tussen jou en de vakman, op de manier die jullie afspreken. Buurklus zit niet tussen de betaling en pakt geen commissie.',
      },
      {
        q: 'En als ik me bedenk?',
        a: 'Je kunt je klus intrekken zolang je nog geen offerte hebt geaccepteerd. Vakmensen die al reageerden krijgen bericht en hun offerte terug.',
      },
    ],
  },
  footer: {
    tagline: 'Het platform dat mensen in Nederland verbindt met vakmensen en bedrijven die ze kunnen vertrouwen.',
    product: 'De dienst',
    company: 'Buurklus',
    legal: 'Juridisch',
    links: {
      about: 'Over ons',
      contact: 'Contact',
      terms: 'Gebruiksvoorwaarden',
      privacy: 'Privacy',
      help: 'Hulp',
    },
    rights: 'Alle rechten voorbehouden.',
    languageLabel: 'Taal',
  },
  pro: {
    hero: {
      eyebrow: 'Voor vakmensen en bedrijven',
      title: 'Vul je agenda zonder achter werk aan te bellen',
      subtitle:
        'Elke dag beschrijven klanten hun klus in jouw gemeente. Ontvang de klussen die bij je vakgebied passen en reageer op wat je aanstaat.',
      cta: 'Maak je gratis account',
      ctaShort: 'Gratis starten',
      note: 'Nu gratis · Zonder betaalgegevens · Geen commissie',
    },
    value: {
      title: 'Wat je krijgt',
      items: [
        {
          title: 'Klussen met een duidelijke vraag',
          body: 'De klant heeft het werk, de gemeente en het budget al beschreven. Je weet waar je op offreert voordat je in de bus stapt.',
        },
        {
          title: 'Jij kiest je klussen',
          body: 'Klussen bekijken kost niets. Je verbruikt pas een offerte op het moment dat je besluit te reageren.',
        },
        {
          title: 'Geen commissie',
          body: 'Je factureert je klant rechtstreeks. Buurklus pakt niets van de waarde van je werk.',
        },
        {
          title: 'Een profiel dat werk oplevert',
          body: 'Je beoordelingen, je jaren ervaring en je gecontroleerde KvK-nummer staan naast elke offerte die je stuurt.',
        },
      ],
    },
    pricing: {
      title: 'Overzichtelijke pakketten',
      subtitle: 'Je betaalt om klussen te ontvangen, nooit een percentage van je omzet.',
      monthly: 'Maandelijks',
      yearly: 'Jaarlijks',
      perMonth: '/ maand',
      perYear: '/ jaar',
      excludingVat: 'excl. btw',
      includingVat: 'incl. btw',
      quotes: 'offertes per maand',
      trades: 'vakgebieden',
      cities: 'gemeenten',
      citiesAll: 'Heel Nederland',
      headStart: 'Klussen {{minutes}} minuten eerder zien',
      noHeadStart: 'Toegang tot klussen in je werkgebied',
      seats: 'medewerkersaccounts',
      choose: 'Dit pakket kiezen',
      popular: 'Meest gekozen',
      vatNote: 'Prijzen zijn exclusief btw. Bij facturatie komt 21% btw erbij.',
      trialNote: 'Elk nieuw account begint met {{days}} dagen proefperiode en {{credits}} gratis offertes.',
      launch: {
        badge: 'Nu gratis',
        title: 'Buurklus kost je voorlopig niets',
        cardTitle: 'Gratis account',
        subtitle:
          'We zijn net begonnen en willen eerst genoeg klussen in elke gemeente. Zolang dat zo is betaal je niets: geen abonnement, geen commissie, geen betaalgegevens.',
        points: [
          '{{credits}} offertes per maand, elke maand opnieuw',
          '{{trades}} vakgebieden en {{cities}} gemeenten',
          'Geen commissie over je omzet',
          'Geen creditcard en geen opzegtermijn',
        ],
        laterTitle: 'En straks?',
        later:
          'Ooit gaat Buurklus geld kosten, anders bestaan we volgend jaar niet meer. Als het zover is hoor je dat minstens {{notice}} dagen van tevoren, per e-mail en in de app. Je gaat nooit vanzelf betalen: zonder dat jij akkoord geeft blijft je account gratis, met dezelfde {{credits}} offertes per maand.',
        cta: 'Gratis account aanmaken',
      },
    },
    how: {
      title: 'Zo begin je',
      steps: [
        { title: 'Maak je profiel', body: 'Je vakgebieden, je werkgebied en je KvK-nummer. Tien minuten werk.' },
        { title: 'Ontvang klussen', body: 'Klussen die bij je vakgebied en je werkgebied passen komen binnen in de app.' },
        { title: 'Stuur je offerte', body: 'Een prijs, een termijn en wat erbij zit. De klant vergelijkt en reageert.' },
      ],
    },
    faq: {
      title: 'Veelgestelde vragen',
      items: [
        {
          q: 'Wat kost Buurklus?',
          a: 'Op dit moment niets. We zijn net begonnen en willen eerst genoeg klussen in elke gemeente hebben. Er is geen abonnement en geen commissie, en we vragen je geen betaalgegevens.',
        },
        {
          q: 'Blijft het gratis?',
          a: 'Dat kunnen we niet beloven. Ooit gaat Buurklus geld kosten. Als het zover is laten we het minstens 30 dagen van tevoren weten, per e-mail en in de app, en gaat er niets automatisch af: je account blijft gratis tot jij zelf akkoord geeft.',
        },
        {
          q: 'Waarom een limiet van 20 offertes per maand?',
          a: 'Om te voorkomen dat één account op elke klus reageert. Voor een vakman die zijn werk doet is twintig offertes per maand ruim; loop je er tegenaan, laat het ons weten.',
        },
        {
          q: 'Wat telt als een offerte?',
          a: 'Elke reactie die je naar een klant stuurt telt er één. Klussen bekijken kost niets. Trekt de klant de klus in vóórdat hij gegund is, dan krijg je je offerte terug.',
        },
        {
          q: 'Heb ik een ingeschreven bedrijf nodig?',
          a: 'Je hebt een KvK-nummer nodig. Dat geldt ook voor zzp’ers: iedereen die in Nederland onderneemt staat ingeschreven.',
        },
      ],
    },
  },
};

const en: SiteCopy = {
  meta: {
    title: 'Buurklus — Find a trusted tradesperson near you',
    description:
      'Describe your job and receive up to 6 free quotes from tradespeople and companies with a verified Chamber of Commerce registration. Free, with no commitment.',
    proTitle: 'Buurklus for tradespeople — Receive jobs near you',
    proDescription:
      'Fill your diary with jobs that match your trade and your service area. Free right now, with no subscription and no commission.',
    ogLocale: 'en_NL',
  },
  nav: {
    trades: 'Trades',
    how: 'How it works',
    pros: 'For tradespeople',
    cta: 'Post a job',
    ctaShort: 'Post a job',
    forCustomers: 'Looking for a tradesperson',
    pricing: 'What it costs',
  },
  hero: {
    eyebrow: 'Free for households',
    title: 'Find a trusted tradesperson near you',
    subtitle:
      'Describe your job in two minutes. Tradespeople and companies in your own municipality send you their quotes. You compare, you choose.',
    primaryCta: 'Post a job',
    secondaryCta: 'Browse the trades',
    note: 'No commitment · Your details go only to the tradesperson you choose',
  },
  proof: {
    trades: 'trades covered',
    cities: 'municipalities',
    free: 'free for customers',
    verified: 'businesses checked at the Chamber of Commerce',
  },
  video: {
    title: 'How it works, in 25 seconds',
    subtitle: 'From a living room that needs painting to a tradesperson you chose yourself.',
    alt: 'An animation showing how you post a job, receive quotes and pick one.',
    subtitlesNote:
      'The film is in Dutch, with sound. English subtitles can be switched on in the player controls.',
    unsupported: 'Your browser cannot play this video.',
  },
  how: {
    title: 'How it works',
    subtitle: 'Three steps, and you have something to compare.',
    steps: [
      {
        title: 'Describe your job',
        body: 'The trade, your municipality, a few photos if you have them. Two minutes, and it costs nothing.',
      },
      {
        title: 'Receive up to 6 quotes',
        body: 'Tradespeople in your area reply with a price, a timescale and what is included. Usually within 24 hours.',
      },
      {
        title: 'Choose with confidence',
        body: 'Compare price, reviews and experience. Only then does the tradesperson you pick receive your address and phone number.',
      },
    ],
  },
  trades: {
    title: 'From a small repair to a full renovation',
    subtitle: 'Every building and maintenance trade, plus the energy work.',
    all: 'And many more',
    budgetFrom: 'from',
  },
  cities: {
    title: 'Across the Netherlands',
    subtitle: 'From Groningen to Maastricht, in the big cities and the towns between them.',
    andMore: 'and {{count}} more municipalities',
  },
  trust: {
    title: 'Why Buurklus',
    items: [
      {
        title: 'Businesses checked against the register',
        body: 'Every tradesperson supplies their Chamber of Commerce number. That register is public, so you can check it yourself.',
      },
      {
        title: 'Reviews that mean something',
        body: 'Only a customer whose job is finished can leave a review, and only once. No bought stars.',
      },
      {
        title: 'Your address stays private',
        body: 'Until you choose, tradespeople see only your municipality and district. Not your address, not your number.',
      },
      {
        title: 'No commission',
        body: 'Buurklus takes nothing from your job. You pay the tradesperson directly, on the terms you agree between you.',
      },
    ],
  },
  proTeaser: {
    title: 'Are you a tradesperson or a service company?',
    body: 'Receive jobs that match your trade and your service area, and fill your diary without chasing work.',
    cta: 'See Buurklus for tradespeople',
    bullets: [
      'Jobs from real customers near you',
      'Reply only when a job suits you',
      'Monthly subscription, no commission on your work',
      '14-day free trial, no payment details',
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What does it cost a household?',
        a: 'Nothing. Posting a job, receiving quotes and messaging tradespeople is entirely free. It is the tradespeople who subscribe.',
      },
      {
        q: 'How many quotes will I get?',
        a: 'Up to six. After that the job closes to new replies, so your decision stays manageable.',
      },
      {
        q: 'Who sees my address and phone number?',
        a: 'Only the tradesperson whose quote you accept. Before that, the others see your municipality and district, nothing more.',
      },
      {
        q: 'How is the job paid for?',
        a: 'Directly between you and the tradesperson, on whatever terms you agree. Buurklus takes no part in the payment and no commission.',
      },
      {
        q: 'What if I change my mind?',
        a: 'You can withdraw your job at any point before you accept a quote. Tradespeople who replied are notified and refunded.',
      },
    ],
  },
  footer: {
    tagline: 'The platform connecting people in the Netherlands with tradespeople and companies they can trust.',
    product: 'The service',
    company: 'Buurklus',
    legal: 'Legal',
    links: {
      about: 'About',
      contact: 'Contact',
      terms: 'Terms of use',
      privacy: 'Privacy',
      help: 'Help',
    },
    rights: 'All rights reserved.',
    languageLabel: 'Language',
  },
  pro: {
    hero: {
      eyebrow: 'For tradespeople and companies',
      title: 'Fill your diary without chasing work',
      subtitle:
        'Customers describe their jobs in your municipality every day. Receive the ones that match your trade, and reply to those worth your time.',
      cta: 'Create your free account',
      ctaShort: 'Start free',
      note: 'Free right now · No payment details · No commission',
    },
    value: {
      title: 'What you get',
      items: [
        {
          title: 'Jobs with a clear brief',
          body: 'The customer has already described the work, the municipality and the budget. You know what you are quoting before you get in the van.',
        },
        {
          title: 'You pick your jobs',
          body: 'Browsing jobs costs nothing. You only spend a quote when you decide to reply.',
        },
        {
          title: 'No commission',
          body: 'You invoice your customer directly. Buurklus takes nothing from the value of your work.',
        },
        {
          title: 'A profile that wins work',
          body: 'Your reviews, your years of experience and your verified Chamber of Commerce number sit beside every quote you send.',
        },
      ],
    },
    pricing: {
      title: 'Straightforward plans',
      subtitle: 'You pay to receive the jobs, never a percentage of your turnover.',
      monthly: 'Monthly',
      yearly: 'Yearly',
      perMonth: '/ month',
      perYear: '/ year',
      excludingVat: 'excl. VAT',
      includingVat: 'incl. VAT',
      quotes: 'quotes per month',
      trades: 'trades',
      cities: 'municipalities',
      citiesAll: 'The whole country',
      headStart: '{{minutes}}-minute head start on new jobs',
      noHeadStart: 'Access to jobs in your service area',
      seats: 'staff accounts',
      choose: 'Choose this plan',
      popular: 'Most chosen',
      vatNote: 'Prices exclude VAT. 21% Dutch VAT is added at invoicing.',
      trialNote: 'Every new account starts with {{days}} days of trial and {{credits}} free quotes.',
      launch: {
        badge: 'Free right now',
        title: 'Buurklus costs you nothing for the time being',
        cardTitle: 'Free account',
        subtitle:
          'We have just started, and we want enough jobs in every municipality first. Until then you pay nothing: no subscription, no commission, no payment details.',
        points: [
          '{{credits}} quotes a month, renewed every month',
          '{{trades}} trades and {{cities}} municipalities',
          'No commission on your turnover',
          'No card and no notice period',
        ],
        laterTitle: 'And later?',
        later:
          'Buurklus will cost money one day, or we will not be here next year. When that happens you will hear about it at least {{notice}} days in advance, by email and in the app. You will never start paying by default: without your agreement your account stays free, with the same {{credits}} quotes a month.',
        cta: 'Create a free account',
      },
    },
    how: {
      title: 'Getting started',
      steps: [
        { title: 'Create your profile', body: 'Your trades, your service area and your Chamber of Commerce number. About ten minutes.' },
        { title: 'Receive jobs', body: 'Jobs matching your trade and your service area arrive in the app.' },
        { title: 'Send your quote', body: 'A price, a timescale and what is included. The customer compares and replies.' },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'What does Buurklus cost?',
          a: 'Nothing at the moment. We have just started and want enough jobs in every municipality first. There is no subscription and no commission, and we do not ask you for payment details.',
        },
        {
          q: 'Will it stay free?',
          a: 'We cannot promise that. Buurklus will cost money one day. When it does we will tell you at least 30 days in advance, by email and in the app, and nothing will be taken automatically: your account stays free until you agree yourself.',
        },
        {
          q: 'Why a limit of 20 quotes a month?',
          a: 'To stop one account replying to every job. For a tradesperson doing their work, twenty quotes a month is plenty; if you run into it, tell us.',
        },
        {
          q: 'What counts as a quote?',
          a: 'Every reply you send a customer counts as one. Browsing jobs costs nothing. If the customer withdraws the job before awarding it, your quote is refunded.',
        },
        {
          q: 'Do I need a registered business?',
          a: 'You need a Chamber of Commerce number. That applies to sole traders too: everyone trading in the Netherlands is registered.',
        },
      ],
    },
  },
};

export const COPY: Record<Locale, SiteCopy> = { nl, en };
