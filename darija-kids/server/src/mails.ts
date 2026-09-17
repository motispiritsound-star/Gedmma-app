/**
 * What the mails say, in the six languages the app speaks.
 *
 * Three kinds, and no more: the one that asks whether this address really
 * wanted this, the one that says hello, and the weekly one that reports how
 * the week went and says something kind about it. Every one of them carries a
 * way out at the bottom, because a mail without one is a mail nobody asked to
 * keep getting.
 *
 * The weekly mail is written from counts alone — units, lessons, words, a
 * streak — so there is nothing in it that could embarrass a child.
 */

export type Taal = 'nl' | 'fr' | 'de' | 'es' | 'it' | 'en'
export const TALEN: Taal[] = ['nl', 'fr', 'de', 'es', 'it', 'en']
export const isTaal = (v: unknown): v is Taal => TALEN.includes(v as Taal)

/**
 * Which wording somebody agreed to, stored with their row.
 *
 * Change the consent text and change this: it is the difference between "they
 * agreed" and "they agreed to this".
 */
export const TEKST_VERSIE = '2026-09-a'

export interface Week {
  units: number
  lessen: number
  woorden: number
  reeks: number
  xp: number
  /** XP since the last weekly mail — the number the mail is actually about. */
  erbij: number
}

interface Pakket {
  bevestigOnderwerp: string
  bevestigKop: string
  bevestigBody: string
  bevestigKnop: string
  bevestigStaart: string
  welkomOnderwerp: string
  welkomKop: string
  welkomBody: string
  weekOnderwerp: (w: Week) => string
  weekKop: (w: Week) => string
  weekRegels: (w: Week) => [string, string][]
  weekWoord: (w: Week) => string
  afmelden: string
  wissen: string
  voet: string
}

/** The line that decides the tone: busy week, quiet week, or nothing at all. */
const toon = <T,>(w: Week, druk: T, rustig: T, stil: T): T =>
  w.erbij >= 150 ? druk : w.erbij > 0 ? rustig : stil

export const MAILS: Record<Taal, Pakket> = {
  nl: {
    bevestigOnderwerp: 'Klopt dit adres?',
    bevestigKop: 'Nog één tik',
    bevestigBody: 'Iemand — waarschijnlijk jij — heeft dit adres opgegeven in Darijaforkids. Bevestig het even, dan weten we zeker dat het van jou is. Doe je niets, dan gebeurt er ook niets: zonder bevestiging sturen we geen mail meer.',
    bevestigKnop: 'Ja, dit adres is van mij',
    bevestigStaart: 'Heb je je niet aangemeld? Gooi deze mail dan weg. Dat is genoeg.',
    welkomOnderwerp: 'Welkom bij Darijaforkids',
    welkomKop: 'Shukran!',
    welkomBody: 'Je staat op de lijst. We schrijven weinig en alleen als er iets te melden valt: een nieuwe unit, een nieuw verhaal, af en toe een aanbieding. Uitschrijven kan onderaan elke mail, met één tik.',
    weekOnderwerp: (w) => toon(w, 'Een goede week', 'De week van Darijaforkids', 'Alles staat nog klaar'),
    weekKop: (w) => toon(w, 'Wat een week', 'De week in het kort', 'Deze week even niet'),
    weekRegels: (w) => [
      ['Units af', String(w.units)],
      ['Lessen af', String(w.lessen)],
      ['Woorden gezien', String(w.woorden)],
      ['Langste reeks', `${w.reeks} dagen`],
    ],
    weekWoord: (w) => toon(
      w,
      'Dit is het tempo waarop een taal blijft hangen. Niets aan veranderen.',
      'Kleine stappen tellen het zwaarst — tien minuten op een dag doet meer dan een uur op zondag.',
      'Geen enkele week hoeft goed te gaan. Vijf minuten vanavond zet de reeks weer in gang.',
    ),
    afmelden: 'Uitschrijven',
    wissen: 'Mijn gegevens wissen',
    voet: 'Je krijgt deze mail omdat je je in Darijaforkids hebt aangemeld.',
  },
  fr: {
    bevestigOnderwerp: 'Cette adresse est bien la vôtre ?',
    bevestigKop: 'Encore un clic',
    bevestigBody: "Quelqu'un — vous, sans doute — a donné cette adresse dans Darijaforkids. Confirmez-la, pour que nous soyons sûrs qu'elle est bien à vous. Si vous ne faites rien, il ne se passe rien : sans confirmation, nous n'écrivons plus.",
    bevestigKnop: 'Oui, cette adresse est la mienne',
    bevestigStaart: "Vous ne vous êtes pas inscrit ? Jetez ce message, cela suffit.",
    welkomOnderwerp: 'Bienvenue chez Darijaforkids',
    welkomKop: 'Shukran !',
    welkomBody: "Vous êtes sur la liste. Nous écrivons peu, et seulement quand il y a quelque chose à dire : une nouvelle unité, une nouvelle histoire, parfois une offre. Se désinscrire se fait en bas de chaque message, en un clic.",
    weekOnderwerp: (w) => toon(w, 'Une bonne semaine', 'La semaine de Darijaforkids', 'Tout vous attend encore'),
    weekKop: (w) => toon(w, 'Quelle semaine', 'La semaine en bref', 'Pas cette semaine'),
    weekRegels: (w) => [
      ['Unités terminées', String(w.units)],
      ['Leçons terminées', String(w.lessen)],
      ['Mots vus', String(w.woorden)],
      ['Plus longue série', `${w.reeks} jours`],
    ],
    weekWoord: (w) => toon(
      w,
      "C'est le rythme auquel une langue reste. N'y changez rien.",
      'Les petits pas pèsent le plus lourd : dix minutes par jour font plus qu’une heure le dimanche.',
      "Aucune semaine n'est obligée de bien se passer. Cinq minutes ce soir et la série repart.",
    ),
    afmelden: 'Se désinscrire',
    wissen: 'Effacer mes données',
    voet: 'Vous recevez ce message parce que vous vous êtes inscrit dans Darijaforkids.',
  },
  de: {
    bevestigOnderwerp: 'Stimmt diese Adresse?',
    bevestigKop: 'Noch ein Klick',
    bevestigBody: 'Jemand — vermutlich du — hat diese Adresse in Darijaforkids angegeben. Bestätige sie kurz, damit wir sicher sind, dass sie dir gehört. Tust du nichts, passiert auch nichts: ohne Bestätigung schreiben wir nicht weiter.',
    bevestigKnop: 'Ja, das ist meine Adresse',
    bevestigStaart: 'Nicht angemeldet? Dann wirf diese Mail weg. Das genügt.',
    welkomOnderwerp: 'Willkommen bei Darijaforkids',
    welkomKop: 'Shukran!',
    welkomBody: 'Du stehst auf der Liste. Wir schreiben selten und nur, wenn es etwas zu sagen gibt: eine neue Einheit, eine neue Geschichte, ab und zu ein Angebot. Abmelden geht unten in jeder Mail, mit einem Klick.',
    weekOnderwerp: (w) => toon(w, 'Eine gute Woche', 'Die Woche bei Darijaforkids', 'Es wartet alles noch'),
    weekKop: (w) => toon(w, 'Was für eine Woche', 'Die Woche in Kürze', 'Diese Woche mal nicht'),
    weekRegels: (w) => [
      ['Einheiten fertig', String(w.units)],
      ['Lektionen fertig', String(w.lessen)],
      ['Wörter gesehen', String(w.woorden)],
      ['Längste Serie', `${w.reeks} Tage`],
    ],
    weekWoord: (w) => toon(
      w,
      'In diesem Tempo bleibt eine Sprache hängen. Daran nichts ändern.',
      'Kleine Schritte wiegen am schwersten — zehn Minuten am Tag bringen mehr als eine Stunde am Sonntag.',
      'Keine Woche muss gut laufen. Fünf Minuten heute Abend, und die Serie läuft wieder.',
    ),
    afmelden: 'Abmelden',
    wissen: 'Meine Daten löschen',
    voet: 'Du bekommst diese Mail, weil du dich in Darijaforkids angemeldet hast.',
  },
  es: {
    bevestigOnderwerp: '¿Es esta tu dirección?',
    bevestigKop: 'Un clic más',
    bevestigBody: 'Alguien — seguramente tú — dio esta dirección en Darijaforkids. Confírmala para que sepamos que es tuya. Si no haces nada, no pasa nada: sin confirmación no volvemos a escribir.',
    bevestigKnop: 'Sí, esta dirección es mía',
    bevestigStaart: '¿No te has apuntado? Tira este correo, con eso basta.',
    welkomOnderwerp: 'Bienvenido a Darijaforkids',
    welkomKop: '¡Shukran!',
    welkomBody: 'Ya estás en la lista. Escribimos poco y solo cuando hay algo que contar: una unidad nueva, un cuento nuevo, de vez en cuando una oferta. Darse de baja se hace al final de cada correo, con un clic.',
    weekOnderwerp: (w) => toon(w, 'Buena semana', 'La semana de Darijaforkids', 'Todo sigue esperando'),
    weekKop: (w) => toon(w, 'Vaya semana', 'La semana en corto', 'Esta semana no'),
    weekRegels: (w) => [
      ['Unidades acabadas', String(w.units)],
      ['Lecciones acabadas', String(w.lessen)],
      ['Palabras vistas', String(w.woorden)],
      ['Racha más larga', `${w.reeks} días`],
    ],
    weekWoord: (w) => toon(
      w,
      'A este ritmo un idioma se queda. No cambies nada.',
      'Los pasos pequeños son los que más pesan: diez minutos al día valen más que una hora el domingo.',
      'Ninguna semana tiene que salir bien. Cinco minutos esta noche y la racha vuelve a empezar.',
    ),
    afmelden: 'Darse de baja',
    wissen: 'Borrar mis datos',
    voet: 'Recibes este correo porque te apuntaste en Darijaforkids.',
  },
  it: {
    bevestigOnderwerp: 'È questo il tuo indirizzo?',
    bevestigKop: 'Ancora un clic',
    bevestigBody: "Qualcuno — probabilmente tu — ha dato questo indirizzo in Darijaforkids. Confermalo, così siamo sicuri che sia tuo. Se non fai niente, non succede niente: senza conferma non scriviamo più.",
    bevestigKnop: 'Sì, questo indirizzo è mio',
    bevestigStaart: 'Non ti sei iscritto? Butta via questa mail, basta così.',
    welkomOnderwerp: 'Benvenuto in Darijaforkids',
    welkomKop: 'Shukran!',
    welkomBody: "Sei nella lista. Scriviamo poco e solo quando c'è qualcosa da dire: una nuova unità, una nuova storia, ogni tanto un'offerta. Per cancellarti basta un clic in fondo a ogni messaggio.",
    weekOnderwerp: (w) => toon(w, 'Una bella settimana', 'La settimana di Darijaforkids', 'È tutto ancora lì'),
    weekKop: (w) => toon(w, 'Che settimana', 'La settimana in breve', 'Questa settimana no'),
    weekRegels: (w) => [
      ['Unità finite', String(w.units)],
      ['Lezioni finite', String(w.lessen)],
      ['Parole viste', String(w.woorden)],
      ['Serie più lunga', `${w.reeks} giorni`],
    ],
    weekWoord: (w) => toon(
      w,
      'È il ritmo con cui una lingua resta. Non cambiare niente.',
      'I passi piccoli pesano di più: dieci minuti al giorno valgono più di un’ora la domenica.',
      'Nessuna settimana deve per forza andare bene. Cinque minuti stasera e la serie riparte.',
    ),
    afmelden: 'Cancellati',
    wissen: 'Cancella i miei dati',
    voet: 'Ricevi questa mail perché ti sei iscritto in Darijaforkids.',
  },
  en: {
    bevestigOnderwerp: 'Is this address yours?',
    bevestigKop: 'One more tap',
    bevestigBody: 'Somebody — probably you — gave this address in Darijaforkids. Confirm it, so we know it is really yours. Do nothing and nothing happens: without a confirmation we do not write again.',
    bevestigKnop: 'Yes, this address is mine',
    bevestigStaart: 'Did not sign up? Throw this away. That is enough.',
    welkomOnderwerp: 'Welcome to Darijaforkids',
    welkomKop: 'Shukran!',
    welkomBody: 'You are on the list. We write rarely, and only when there is something to say: a new unit, a new story, now and then an offer. Unsubscribing is one tap at the bottom of every mail.',
    weekOnderwerp: (w) => toon(w, 'A good week', 'The week at Darijaforkids', 'It is all still waiting'),
    weekKop: (w) => toon(w, 'What a week', 'The week in short', 'Not this week'),
    weekRegels: (w) => [
      ['Units finished', String(w.units)],
      ['Lessons finished', String(w.lessen)],
      ['Words seen', String(w.woorden)],
      ['Longest streak', `${w.reeks} days`],
    ],
    weekWoord: (w) => toon(
      w,
      'This is the pace at which a language sticks. Change nothing.',
      'Small steps weigh the most — ten minutes a day beats an hour on Sunday.',
      'No week has to go well. Five minutes tonight and the streak starts again.',
    ),
    afmelden: 'Unsubscribe',
    wissen: 'Erase my data',
    voet: 'You are getting this because you signed up in Darijaforkids.',
  },
}
