import type { Locale } from '@focusfamily/domain';

/**
 * Strings that belong to this app shell rather than to the product vocabulary.
 * Anything a family reads about agreements, focus, consent or data comes from
 * the shared catalogue in @focusfamily/domain instead.
 */
const strings = {
  nl: {
    save: 'Opslaan',
    saved: 'Opgeslagen',
    minutes: 'minuten',
    today: 'Vandaag',
    agreements: 'Afspraken',
    focus: 'Focus',
    checkin: 'Check-in',
    review: 'Week',
    data: 'Gegevens',
    whatIsMeasured: 'Wat wordt er bijgehouden',
    everyoneSeesThis: 'Iedereen in het gezin ziet dit scherm, ook de kinderen.',
    waitingForConnection: 'Wacht op verbinding',
    demoNotice:
      'Deze app draait met de mock-adapter. Er wordt geen schermtijd van een echt apparaat gelezen.',
  },
  en: {
    save: 'Save',
    saved: 'Saved',
    minutes: 'minutes',
    today: 'Today',
    agreements: 'Agreements',
    focus: 'Focus',
    checkin: 'Check-in',
    review: 'Week',
    data: 'Data',
    whatIsMeasured: 'What is being recorded',
    everyoneSeesThis: 'Everyone in the family sees this screen, children included.',
    waitingForConnection: 'Waiting for a connection',
    demoNotice:
      'This app runs on the mock adapter. No screen time is read from a real device.',
  },
} as const;

export type StringKey = keyof (typeof strings)['nl'];

export function ui(locale: Locale, key: StringKey): string {
  return strings[locale][key];
}
