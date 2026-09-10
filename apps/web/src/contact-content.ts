import type { Locale } from '@buurklus/shared';

/**
 * The contact page. Short on purpose: a contact form that asks for a subject,
 * a category, a phone number and a postcode gets fewer messages than one that
 * asks for a name and a message, and every extra field is one more thing to
 * justify in the privacy statement and delete on time.
 */
export interface ContactCopy {
  meta: { title: string; description: string };
  title: string;
  lede: string;
  form: {
    legend: string;
    name: string;
    email: string;
    emailHint: string;
    message: string;
    messageHint: string;
    submit: string;
    submitting: string;
  };
  privacy: { title: string; items: string[]; link: string };
  states: {
    successTitle: string;
    successBody: string;
    errorName: string;
    errorEmail: string;
    errorMessage: string;
    errorBody: string;
    offlineBody: string;
    tooMany: string;
    noScript: string;
  };
  alternatives: { title: string; body: string };
}

const nl: ContactCopy = {
  meta: {
    title: 'Contact — Buurklus',
    description:
      'Een vraag, een tip of iets dat niet werkt? Stuur een bericht. We lezen alles en antwoorden meestal binnen een paar werkdagen.',
  },
  title: 'Neem contact op',
  lede: 'Een vraag over hoe het werkt, een tip, of iets op de site dat niet doet wat het hoort te doen — laat het weten. We lezen alles zelf.',
  form: {
    legend: 'Je bericht',
    name: 'Je naam',
    email: 'E-mailadres',
    emailHint: 'Hier sturen we het antwoord naartoe.',
    message: 'Waar gaat het over?',
    messageHint: 'Hoe concreter, hoe sneller we je kunnen helpen.',
    submit: 'Versturen',
    submitting: 'Bezig met versturen…',
  },
  privacy: {
    title: 'Wat er met je bericht gebeurt',
    items: [
      'We gebruiken je naam en adres om je vraag te beantwoorden, en verder nergens voor.',
      'Je komt hiermee niet op een mailinglijst. Daar is het aanmeldformulier voor, en dat vraagt apart om toestemming.',
      'Een afgehandeld bericht bewaren we nog een jaar, voor het geval je erop terugkomt. Daarna wordt het verwijderd.',
      'We verkopen je gegevens niet en delen ze met niemand.',
    ],
    link: 'Lees het privacybeleid',
  },
  states: {
    successTitle: 'Je bericht is verstuurd',
    successBody:
      'Dank je wel. We hebben het binnengekregen en antwoorden meestal binnen een paar werkdagen op het adres dat je hebt ingevuld.',
    errorName: 'Vul je naam in.',
    errorEmail: 'Vul een geldig e-mailadres in.',
    errorMessage: 'Schrijf even wat er aan de hand is — een paar zinnen is genoeg.',
    errorBody: 'Controleer je gegevens en probeer het opnieuw.',
    offlineBody:
      'Er is even geen verbinding met onze server. Probeer het zo nog eens; er is niets verstuurd en niets opgeslagen.',
    tooMany: 'Er zijn net al een paar berichten vanaf dit adres verstuurd. Probeer het over een uur nog eens.',
    noScript: 'Voor dit formulier is JavaScript nodig. Zet het aan en probeer het opnieuw.',
  },
  alternatives: {
    title: 'Iets anders nodig?',
    body: 'Wil je je gegevens inzien of laten verwijderen, dan hoef je daar geen formulier voor in te vullen — vraag het gewoon in je bericht, dan regelen we het.',
  },
};

const en: ContactCopy = {
  meta: {
    title: 'Contact — Buurklus',
    description:
      'A question, a tip, or something that does not work? Send a message. We read everything and usually reply within a few working days.',
  },
  title: 'Get in touch',
  lede: 'A question about how it works, a tip, or something on the site that does not do what it should — let us know. We read everything ourselves.',
  form: {
    legend: 'Your message',
    name: 'Your name',
    email: 'Email address',
    emailHint: 'This is where the reply goes.',
    message: 'What is it about?',
    messageHint: 'The more specific, the sooner we can help.',
    submit: 'Send',
    submitting: 'Sending…',
  },
  privacy: {
    title: 'What happens to your message',
    items: [
      'We use your name and address to answer your question, and for nothing else.',
      'This does not put you on a mailing list. That is what the sign-up form is for, and it asks for consent separately.',
      'A message that has been dealt with is kept for another year, in case you come back to it. After that it is deleted.',
      'We do not sell your details and we share them with nobody.',
    ],
    link: 'Read the privacy statement',
  },
  states: {
    successTitle: 'Your message has been sent',
    successBody:
      'Thank you. We have received it and usually reply within a few working days, to the address you entered.',
    errorName: 'Please enter your name.',
    errorEmail: 'Please enter a valid email address.',
    errorMessage: 'Please write what this is about — a few sentences is enough.',
    errorBody: 'Check your details and try again.',
    offlineBody:
      'There is no connection to our server right now. Try again shortly; nothing was sent and nothing was saved.',
    tooMany: 'A few messages have just been sent from this address. Please try again in an hour.',
    noScript: 'This form needs JavaScript. Switch it on and try again.',
  },
  alternatives: {
    title: 'Need something else?',
    body: 'If you want to see or delete your data, there is no separate form for it — just ask in your message and we will sort it out.',
  },
};

export const CONTACT_COPY: Record<Locale, ContactCopy> = { nl, en };
