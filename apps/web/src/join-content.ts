import type { Locale } from '@buurklus/shared';

/**
 * The registration page. Kept out of content.ts because it is the only page on
 * the site that asks somebody for something, and a form needs a vocabulary the
 * rest of the site does not: labels, validation messages, a success state and
 * an honest account of what happens to the address afterwards.
 */
export interface JoinCopy {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; subtitle: string };
  /** The two sides of the marketplace, as a choice made before anything else. */
  roles: {
    customer: { label: string; title: string; body: string; bullets: string[] };
    pro: { label: string; title: string; body: string; bullets: string[] };
  };
  form: {
    legend: string;
    email: string;
    emailHint: string;
    name: string;
    nameCustomer: string;
    namePro: string;
    phone: string;
    phoneHint: string;
    city: string;
    cityPlaceholder: string;
    /** The pro's own trades. */
    trades: string;
    tradesHint: string;
    /** The same checkboxes, asked of a customer: what the job is. */
    tradesCustomer: string;
    tradesCustomerHint: string;
    /** A line about the job, in the customer's own words. */
    job: string;
    jobHint: string;
    jobPlaceholder: string;
    kvk: string;
    kvkHint: string;
    optional: string;
    /**
     * What the tick actually agrees to, per side. It used to say only "tell me
     * when you open"; a customer's job description is now passed on to
     * tradespeople nearby, and consent that does not mention that is consent
     * for something else.
     */
    consent: string;
    consentPro: string;
    submit: string;
    submitting: string;
  };
  states: {
    successTitle: string;
    successBody: string;
    againTitle: string;
    againBody: string;
    errorTitle: string;
    errorBody: string;
    offlineTitle: string;
    offlineBody: string;
    validationEmail: string;
    validationConsent: string;
    validationKvk: string;
    noScript: string;
    /** Offered whenever the form itself cannot get through. Only shown once
     *  OPERATOR.email is filled in — an invitation to write to an address that
     *  does not exist is worse than no invitation. */
    mailFallback: string;
  };
  /** What we do with the address, said before it is typed rather than after. */
  promise: { title: string; items: string[] };
  next: { title: string; steps: { title: string; body: string }[] };
}

const nl: JoinCopy = {
  meta: {
    title: 'Aanmelden — Buurklus',
    description:
      'Meld je aan voor Buurklus. Gratis, zonder betaalgegevens. Als klant die een vakman zoekt, of als vakman of bedrijf dat klussen wil ontvangen.',
  },
  hero: {
    eyebrow: 'Nu gratis',
    title: 'Meld je aan voor Buurklus',
    subtitle:
      'We zijn aan het opbouwen. Laat weten wie je bent en in welke gemeente je zit, dan krijg je bericht zodra Buurklus bij jou in de buurt opengaat. Het kost niets en we vragen geen betaalgegevens.',
  },
  roles: {
    customer: {
      label: 'Ik heb een klus',
      title: 'Voor je huis',
      body: 'Je hebt een klus en je wilt weten wat het kost. Beschrijf hem één keer en laat vakmensen uit je eigen gemeente reageren met een prijs.',
      bullets: [
        'Tot 6 offertes op één klusomschrijving',
        'Je krijgt alleen reacties van vakmensen met een gecontroleerd KvK-nummer',
        'Je adres en telefoonnummer blijven verborgen tot jij de klus gunt',
        'Altijd gratis voor particulieren',
      ],
    },
    pro: {
      label: 'Ik ben vakman of bedrijf',
      title: 'Voor je agenda',
      body: 'Klussen uit jouw vakgebied en jouw werkgebied komen bij je binnen. Je bekijkt ze gratis en reageert alleen op wat je aanstaat.',
      bullets: [
        'Klussen met een omschrijving, een gemeente en een budget',
        'Geen commissie over je omzet — je factureert de klant zelf',
        'Nu gratis, met 20 offertes per maand',
        'Minstens 30 dagen van tevoren bericht voordat er ooit iets gaat kosten',
      ],
    },
  },
  form: {
    legend: 'Je gegevens',
    email: 'E-mailadres',
    emailHint: 'Hier laten we weten wanneer je terechtkunt.',
    name: 'Naam',
    nameCustomer: 'Je naam',
    namePro: 'Bedrijfsnaam',
    phone: 'Mobiel nummer',
    phoneHint: 'Alleen als je liever gebeld wordt dan gemaild.',
    city: 'Gemeente',
    cityPlaceholder: 'Kies je gemeente',
    trades: 'Wat doe je?',
    tradesHint: 'Kies maximaal 5 vakgebieden.',
    tradesCustomer: 'Waar gaat je klus over?',
    tradesCustomerHint:
      'Kies wat het dichtst in de buurt komt. Hiermee zoeken we vakmensen bij jou in de buurt die dit doen.',
    job: 'Vertel kort wat er moet gebeuren',
    jobHint: 'Eén of twee zinnen is genoeg. Dit lezen de vakmensen die reageren.',
    jobPlaceholder: 'Bijvoorbeeld: woonkamer van 30 m² schilderen, muren en plafond.',
    kvk: 'KvK-nummer',
    kvkHint: 'Acht cijfers. Ook zzp’ers staan ingeschreven.',
    optional: 'niet verplicht',
    consent:
      'Ja, mail me over mijn klus en leg mijn aanvraag voor aan vakmensen bij mij in de buurt.',
    consentPro:
      'Ja, mail me klussen uit mijn vakgebied en mijn regio, en laat me weten wanneer Buurklus opengaat.',
    submit: 'Aanmelden',
    submitting: 'Bezig…',
  },
  states: {
    successTitle: 'Gelukt — je staat op de lijst',
    successBody:
      'Je hoort van ons zodra Buurklus in jouw gemeente opengaat. Wil je er weer af, mail ons dan; dat kan altijd en het kost je niets.',
    againTitle: 'Je stond er al op',
    againBody:
      'Dit adres stond al op de lijst. We hebben je gegevens bijgewerkt — je hoeft verder niets te doen.',
    errorTitle: 'Dat ging mis',
    errorBody: 'Controleer je gegevens en probeer het opnieuw.',
    offlineTitle: 'We konden je aanmelding niet versturen',
    offlineBody:
      'Er is even geen verbinding met onze server. Probeer het zo nog eens; er is niets verstuurd en niets opgeslagen.',
    validationEmail: 'Vul een geldig e-mailadres in.',
    validationConsent: 'Zet een vinkje zodat we je mogen mailen.',
    validationKvk: 'Vul je KvK-nummer in: acht cijfers.',
    noScript: 'Voor dit formulier is JavaScript nodig. Zet het aan en probeer het opnieuw.',
    mailFallback: 'Lukt het niet? Mail je aanmelding naar',
  },
  promise: {
    title: 'Wat we met je adres doen',
    items: [
      'We mailen je over je eigen klus, en als Buurklus bij jou opengaat. Verder alleen als er iets is dat je echt moet weten.',
      'We verkopen je gegevens nooit. Vakmensen zien je klus en je gemeente — niet je naam, je adres of je telefoonnummer. Die krijgt alleen de vakman die jij zelf kiest.',
      'Afmelden kan altijd, in één mail, zonder gedoe.',
      'Blijft het stil, dan verwijderen we je gegevens vanzelf.',
    ],
  },
  next: {
    title: 'Wat er daarna gebeurt',
    steps: [
      {
        title: 'Je krijgt bericht',
        body: 'Zodra er genoeg vakmensen én klanten in je gemeente zijn, laten we het weten. Zonder dat allebei werkt een marktplaats niet.',
      },
      {
        title: 'Je maakt je account',
        body: 'Inloggen gaat met een code per sms. Geen wachtwoord om te vergeten en geen betaalgegevens.',
      },
      {
        title: 'Je begint',
        body: 'Als klant plaats je je eerste klus. Als vakman zet je je vakgebieden en werkgebied klaar en komen de klussen binnen.',
      },
    ],
  },
};

const en: JoinCopy = {
  meta: {
    title: 'Sign up — Buurklus',
    description:
      'Join Buurklus. Free, with no payment details. As a household looking for a tradesperson, or as a tradesperson or company wanting jobs.',
  },
  hero: {
    eyebrow: 'Free right now',
    title: 'Join Buurklus',
    subtitle:
      'We are building this up. Tell us who you are and which municipality you are in, and we will let you know when Buurklus opens near you. It costs nothing and we ask for no payment details.',
  },
  roles: {
    customer: {
      label: 'I have a job',
      title: 'For your home',
      body: 'You have a job and you want to know what it costs. Describe it once and let tradespeople from your own municipality reply with a price.',
      bullets: [
        'Up to 6 quotes on one job description',
        'You only hear from tradespeople with a verified Chamber of Commerce number',
        'Your address and phone number stay hidden until you award the job',
        'Always free for households',
      ],
    },
    pro: {
      label: 'I am a tradesperson or company',
      title: 'For your diary',
      body: 'Jobs in your trade and your service area arrive with you. Browsing them is free and you reply only to what suits you.',
      bullets: [
        'Jobs with a description, a municipality and a budget',
        'No commission on your turnover — you invoice the customer yourself',
        'Free right now, with 20 quotes a month',
        'At least 30 days’ notice before anything ever costs money',
      ],
    },
  },
  form: {
    legend: 'Your details',
    email: 'Email address',
    emailHint: 'This is where we will tell you when you can start.',
    name: 'Name',
    nameCustomer: 'Your name',
    namePro: 'Business name',
    phone: 'Mobile number',
    phoneHint: 'Only if you would rather be called than emailed.',
    city: 'Municipality',
    cityPlaceholder: 'Choose your municipality',
    trades: 'What do you do?',
    tradesHint: 'Pick up to 5 trades.',
    tradesCustomer: 'What is your job about?',
    tradesCustomerHint:
      'Pick whatever comes closest. We use it to find tradespeople near you who do this work.',
    job: 'Briefly, what needs doing?',
    jobHint: 'A sentence or two is plenty. The tradespeople who reply read this.',
    jobPlaceholder: 'For example: paint a 30 m² living room, walls and ceiling.',
    kvk: 'Chamber of Commerce number',
    kvkHint: 'Eight digits. Sole traders are registered too.',
    optional: 'optional',
    consent:
      'Yes, email me about my job and put my request to tradespeople near me.',
    consentPro:
      'Yes, email me jobs in my trade and my area, and tell me when Buurklus opens.',
    submit: 'Sign up',
    submitting: 'Sending…',
  },
  states: {
    successTitle: 'Done — you are on the list',
    successBody:
      'You will hear from us as soon as Buurklus opens in your municipality. If you want off the list, email us; you can do that at any time and it costs you nothing.',
    againTitle: 'You were already on it',
    againBody:
      'This address was already on the list. We have updated your details — there is nothing else to do.',
    errorTitle: 'That did not work',
    errorBody: 'Check your details and try again.',
    offlineTitle: 'We could not send your registration',
    offlineBody:
      'There is no connection to our server right now. Try again shortly; nothing was sent and nothing was saved.',
    validationEmail: 'Please enter a valid email address.',
    validationConsent: 'Please tick the box so we may email you.',
    validationKvk: 'Please enter your Chamber of Commerce number: eight digits.',
    noScript: 'This form needs JavaScript. Switch it on and try again.',
    mailFallback: 'Not working? Email your registration to',
  },
  promise: {
    title: 'What we do with your address',
    items: [
      'We email you about your own job, and when Buurklus opens for you. After that only when there is something you really need to know.',
      'We never sell your data. Tradespeople see your job and your municipality — not your name, address or phone number. Only the one you choose gets those.',
      'You can unsubscribe at any time, in one email, without a fuss.',
      'If nothing happens, your details are deleted on their own.',
    ],
  },
  next: {
    title: 'What happens next',
    steps: [
      {
        title: 'You hear from us',
        body: 'As soon as there are enough tradespeople and enough customers in your municipality, we let you know. Without both, a marketplace does not work.',
      },
      {
        title: 'You create your account',
        body: 'Signing in works with a code by SMS. No password to forget and no payment details.',
      },
      {
        title: 'You start',
        body: 'As a household you post your first job. As a tradesperson you set your trades and service area, and the jobs come in.',
      },
    ],
  },
};

export const JOIN_COPY: Record<Locale, JoinCopy> = { nl, en };
