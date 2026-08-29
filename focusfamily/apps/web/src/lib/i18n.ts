import { cookies } from 'next/headers';
import { createTranslator, type Locale } from '@focusfamily/domain';

export const LOCALE_COOKIE = 'ff_locale';

export async function currentLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return value === 'en' ? 'en' : 'nl';
}

export async function getTranslator(): Promise<{
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
}> {
  const locale = await currentLocale();
  return { t: createTranslator(locale), locale };
}

/** Language-specific strings that belong to the website rather than the product. */
export const site = {
  nl: {
    'nav.home': 'Home',
    'nav.pricing': 'Prijzen',
    'nav.privacy': 'Privacy',
    'nav.education': 'Bibliotheek',
    'nav.signin': 'Inloggen',
    'nav.signout': 'Uitloggen',
    'nav.app': 'Naar de app',
    'nav.skip': 'Direct naar de inhoud',
    'nav.language': 'Taal',
    'app.nav.today': 'Vandaag',
    'app.nav.agreements': 'Afspraken',
    'app.nav.focus': 'Focusmomenten',
    'app.nav.checkin': 'Check-in',
    'app.nav.review': 'Weekoverzicht',
    'app.nav.goals': 'Doelen',
    'app.nav.activities': 'Activiteiten',
    'app.nav.data': 'Gegevens en toestemming',
    'app.nav.plan': 'Abonnement',
    'app.nav.admin': 'Beheer',
    'home.hero.title': 'Samen tijd maken, in plaats van tijd afpakken',
    'home.hero.body':
      'FocusFamily helpt gezinnen om momenten zonder schermen af te spreken en die samen vol te houden. Geen stiekem meekijken, geen ranglijsten, geen oordeel. Wat voor de kinderen geldt, geldt ook voor de volwassenen.',
    'home.cta.primary': 'Begin met een afspraak',
    'home.cta.secondary': 'Lees hoe we met gegevens omgaan',
    'home.principles.title': 'Waar we voor kiezen',
    'home.principle.1.title': 'Afspraken, geen controle',
    'home.principle.1.body':
      'Iedereen ziet dezelfde afspraken en dezelfde metingen. Er is geen scherm dat alleen een ouder kan openen.',
    'home.principle.2.title': 'Volwassenen doen mee',
    'home.principle.2.body':
      'Een afspraak kan pas ingaan als er minstens één regel voor de volwassenen in staat. De app weigert het anders.',
    'home.principle.3.title': 'Eerlijk over cijfers',
    'home.principle.3.body':
      'Bij elk getal staat waar het vandaan komt: zelf ingevuld, door de app gezien of door de telefoon gemeld. Wat we niet weten, verzinnen we niet.',
    'home.principle.4.title': 'Geen straf, geen schaamte',
    'home.principle.4.body':
      'Geen puntenlijst, geen reeks die je kwijtraakt, geen melding dat het niet gelukt is. Wel een gesprek aan tafel.',
    'home.never.title': 'Wat FocusFamily nooit doet',
    'signin.title': 'Inloggen',
    'signin.email': 'E-mailadres',
    'signin.password': 'Wachtwoord',
    'signin.submit': 'Inloggen',
    'signin.demo': 'Demo-account',
    'signin.demo.body':
      'In de demo kun je inloggen als Noor (ouder), Sam (ouder) of Lena (15). Het wachtwoord staat in de README.',
    'pricing.title': 'Wat kost het',
    'pricing.free.title': 'Gratis',
    'pricing.premium.title': 'Family Premium',
    'pricing.sponsored.title': 'Betaald door werkgever of school',
    'error.generic': 'Er ging iets mis. Probeer het opnieuw.',
    'error.api': 'De server is even niet bereikbaar.',
    'common.save': 'Opslaan',
    'common.saved': 'Opgeslagen',
    'common.cancel': 'Annuleren',
    'common.back': 'Terug',
    'common.loading': 'Bezig…',
    'common.none': 'Nog niets',
    'common.who': 'Voor wie',
    'common.when': 'Wanneer',
    'common.everyone': 'Iedereen',
    'common.adults': 'Volwassenen',
    'common.children': 'Kinderen',
    'common.minutes': 'minuten',
  },
  en: {
    'nav.home': 'Home',
    'nav.pricing': 'Pricing',
    'nav.privacy': 'Privacy',
    'nav.education': 'Library',
    'nav.signin': 'Sign in',
    'nav.signout': 'Sign out',
    'nav.app': 'Open the app',
    'nav.skip': 'Skip to content',
    'nav.language': 'Language',
    'app.nav.today': 'Today',
    'app.nav.agreements': 'Agreements',
    'app.nav.focus': 'Focus moments',
    'app.nav.checkin': 'Check-in',
    'app.nav.review': 'Weekly review',
    'app.nav.goals': 'Goals',
    'app.nav.activities': 'Activities',
    'app.nav.data': 'Data and consent',
    'app.nav.plan': 'Plan',
    'app.nav.admin': 'Admin',
    'home.hero.title': 'Make time together, instead of taking time away',
    'home.hero.body':
      'FocusFamily helps families agree on device-free moments and keep them together. No secret monitoring, no leaderboards, no verdict. What applies to the children applies to the grown-ups too.',
    'home.cta.primary': 'Start with an agreement',
    'home.cta.secondary': 'Read how we handle data',
    'home.principles.title': 'What we stand for',
    'home.principle.1.title': 'Agreements, not surveillance',
    'home.principle.1.body':
      'Everyone sees the same agreements and the same measurements. There is no screen only a parent can open.',
    'home.principle.2.title': 'Grown-ups take part',
    'home.principle.2.body':
      'An agreement cannot come into force unless at least one rule applies to the adults. The app refuses otherwise.',
    'home.principle.3.title': 'Honest about numbers',
    'home.principle.3.body':
      'Every figure says where it came from: typed in by you, seen by the app, or reported by the phone. What we do not know, we do not invent.',
    'home.principle.4.title': 'No punishment, no shame',
    'home.principle.4.body':
      'No points table, no run you can lose, no notification that it did not work out. A conversation at the table instead.',
    'home.never.title': 'What FocusFamily never does',
    'signin.title': 'Sign in',
    'signin.email': 'Email address',
    'signin.password': 'Password',
    'signin.submit': 'Sign in',
    'signin.demo': 'Demo account',
    'signin.demo.body':
      'In the demo you can sign in as Noor (guardian), Sam (guardian) or Lena (15). The password is in the README.',
    'pricing.title': 'What it costs',
    'pricing.free.title': 'Free',
    'pricing.premium.title': 'Family Premium',
    'pricing.sponsored.title': 'Paid by an employer or school',
    'error.generic': 'Something went wrong. Please try again.',
    'error.api': 'The server is not reachable right now.',
    'common.save': 'Save',
    'common.saved': 'Saved',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.loading': 'Working…',
    'common.none': 'Nothing yet',
    'common.who': 'Who',
    'common.when': 'When',
    'common.everyone': 'Everyone',
    'common.adults': 'Grown-ups',
    'common.children': 'Children',
    'common.minutes': 'minutes',
  },
} as const;

export type SiteKey = keyof (typeof site)['nl'];

export async function getSiteText(): Promise<{
  s: (key: SiteKey) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
}> {
  const { t, locale } = await getTranslator();
  return { s: (key: SiteKey) => site[locale][key], t, locale };
}
