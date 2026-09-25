/**
 * Wat iemand aanvinkt bij het aanmaken van een account, en bij het afrekenen.
 *
 * Eerlijk over wat een vinkje wél en niet doet: het sluit niets uit. Het legt
 * vast dat iemand iets is overeengekomen en dat hij is geïnformeerd, en dat
 * verschuift het gesprek achteraf van "dat wist ik niet" naar "dat heb je
 * aangevinkt". Meer moet je er niet van verwachten — en dat is al veel.
 *
 * Vier regels waar dit zich aan houdt, en ze zijn geen smaak:
 *
 *  1. **Niets staat vooraf aangevinkt.** Een vooraf gezet vinkje is onder de
 *     AVG geen toestemming. Dan is de hele lijst waardeloos op het moment dat
 *     er iemand naar vraagt.
 *  2. **De nieuwsbrief staat los.** Toestemming die je moet geven om iets
 *     anders te kunnen doen, is geen toestemming. Koppel je ze, dan is de
 *     nieuwsbrief onrechtmatig én de aankoop discutabel.
 *  3. **Voorwaarden vink je aan, de privacyverklaring niet.** Voorwaarden zijn
 *     een overeenkomst; een privacyverklaring is informatie. Iemand laten
 *     "instemmen" met informatie wekt de indruk dat hij iets weggeeft wat hij
 *     niet hoeft weg te geven.
 *  4. **Het herroepingsrecht staat apart, en alleen bij het afrekenen.** Dit
 *     is de enige regel hier met een prijskaartje: zonder dit vinkje mag een
 *     koper binnen veertien dagen zijn geld terugvragen, ook nadat hij alles
 *     heeft gedownload. Mét dit vinkje vervalt dat recht op het moment dat de
 *     levering begint. Het moet uitdrukkelijk, apart, en in zijn eigen woorden
 *     bevestigd worden — een zin in de voorwaarden is niet genoeg.
 *
 * Wat hier met opzet niet gevraagd wordt: een naam, een adres, een
 * geboortedatum, iets over het kind. Een e-mailadres is genoeg om iemand
 * binnen te laten en zijn boeken te tonen, en wat je niet hebt kan niet
 * uitlekken en hoeft niet te worden gewist.
 */

export interface Vinkje {
  /** De tekst naast het vakje. */
  tekst: string
  /** Moet dit aan staan voordat de knop werkt? */
  verplicht: boolean
}

export interface Toestemming {
  /** Bij het aanmaken van een account. */
  voorwaarden: Vinkje
  leeftijd: Vinkje
  nieuwsbrief: Vinkje
  /** Alleen bij het afrekenen, en nergens anders. */
  herroeping: Vinkje
  /** Onder de vakjes, zonder vinkje: informatie en geen overeenkomst. */
  privacyNoot: string
  /** Waarom er een e-mailadres wordt gevraagd en verder niets. */
  waaromEmail: string
}

export const TOESTEMMING: Record<string, Toestemming> = {
  nl: {
    voorwaarden: { tekst: 'Ik ga akkoord met de gebruiksvoorwaarden.', verplicht: true },
    leeftijd: { tekst: 'Ik ben zestien jaar of ouder en maak dit account als ouder of verzorger.', verplicht: true },
    nieuwsbrief: { tekst: 'Houd me op de hoogte van nieuwe delen en boeken. Hooguit één mail per maand, opzeggen kan met één tik.', verplicht: false },
    herroeping: { tekst: 'Ik wil meteen bij mijn boeken kunnen, en ik weet dat mijn herroepingsrecht vervalt zodra de levering begint.', verplicht: true },
    privacyNoot: 'Hoe we met je gegevens omgaan staat in de privacyverklaring.',
    waaromEmail: 'We vragen alleen je e-mailadres. Daarmee log je in en zie je je boeken — een wachtwoord heb je niet nodig. Over je kind slaan we niets op.',
  },
  fr: {
    voorwaarden: { tekst: 'J’accepte les conditions d’utilisation.', verplicht: true },
    leeftijd: { tekst: 'J’ai seize ans ou plus et je crée ce compte en tant que parent ou tuteur.', verplicht: true },
    nieuwsbrief: { tekst: 'Tenez-moi au courant des nouveaux tomes et livres. Un e-mail par mois au maximum, désinscription en un clic.', verplicht: false },
    herroeping: { tekst: 'Je veux accéder tout de suite à mes livres et je sais que mon droit de rétractation prend fin dès le début de la livraison.', verplicht: true },
    privacyNoot: 'La façon dont nous traitons vos données est expliquée dans la déclaration de confidentialité.',
    waaromEmail: 'Nous ne demandons que votre adresse e-mail. Elle sert à vous connecter et à retrouver vos livres — pas besoin de mot de passe. Nous ne conservons rien sur votre enfant.',
  },
  de: {
    voorwaarden: { tekst: 'Ich stimme den Nutzungsbedingungen zu.', verplicht: true },
    leeftijd: { tekst: 'Ich bin sechzehn Jahre oder älter und lege dieses Konto als Elternteil oder Erziehungsberechtigter an.', verplicht: true },
    nieuwsbrief: { tekst: 'Haltet mich über neue Bände und Bücher auf dem Laufenden. Höchstens eine E-Mail im Monat, Abmelden mit einem Klick.', verplicht: false },
    herroeping: { tekst: 'Ich möchte sofort auf meine Bücher zugreifen und weiß, dass mein Widerrufsrecht mit dem Beginn der Lieferung erlischt.', verplicht: true },
    privacyNoot: 'Wie wir mit deinen Daten umgehen, steht in der Datenschutzerklärung.',
    waaromEmail: 'Wir fragen nur nach deiner E-Mail-Adresse. Damit meldest du dich an und siehst deine Bücher — ein Passwort brauchst du nicht. Über dein Kind speichern wir nichts.',
  },
  es: {
    voorwaarden: { tekst: 'Acepto las condiciones de uso.', verplicht: true },
    leeftijd: { tekst: 'Tengo dieciséis años o más y creo esta cuenta como madre, padre o tutor.', verplicht: true },
    nieuwsbrief: { tekst: 'Avisadme de los nuevos libros. Como mucho un correo al mes, y darse de baja es un clic.', verplicht: false },
    herroeping: { tekst: 'Quiero acceder a mis libros ahora mismo y sé que pierdo el derecho de desistimiento en cuanto empiece la entrega.', verplicht: true },
    privacyNoot: 'Cómo tratamos tus datos está en la declaración de privacidad.',
    waaromEmail: 'Solo pedimos tu correo electrónico. Con él entras y ves tus libros — no necesitas contraseña. De tu hijo no guardamos nada.',
  },
  it: {
    voorwaarden: { tekst: 'Accetto le condizioni d’uso.', verplicht: true },
    leeftijd: { tekst: 'Ho sedici anni o più e creo questo account come genitore o tutore.', verplicht: true },
    nieuwsbrief: { tekst: 'Tenetemi aggiornato sui nuovi libri. Al massimo una mail al mese, disiscriversi è un clic.', verplicht: false },
    herroeping: { tekst: 'Voglio accedere subito ai miei libri e so che il diritto di recesso decade appena inizia la consegna.', verplicht: true },
    privacyNoot: 'Come trattiamo i tuoi dati è spiegato nell’informativa sulla privacy.',
    waaromEmail: 'Chiediamo solo il tuo indirizzo e-mail. Serve per entrare e vedere i tuoi libri — nessuna password. Di tuo figlio non conserviamo nulla.',
  },
  en: {
    voorwaarden: { tekst: 'I agree to the terms of use.', verplicht: true },
    leeftijd: { tekst: 'I am sixteen or older and I am creating this account as a parent or guardian.', verplicht: true },
    nieuwsbrief: { tekst: 'Keep me posted about new books. One email a month at most, and unsubscribing is one tap.', verplicht: false },
    herroeping: { tekst: 'I want to open my books straight away, and I understand that my right of withdrawal ends once delivery begins.', verplicht: true },
    privacyNoot: 'How we handle your data is set out in the privacy statement.',
    waaromEmail: 'We only ask for your email address. It is how you sign in and find your books — no password needed. We store nothing about your child.',
  },
}

export const toestemmingVan = (taal: string): Toestemming => TOESTEMMING[taal] ?? TOESTEMMING.nl!

/** De vakjes die bij het aanmaken van een account horen, in de volgorde van het scherm. */
export const REGISTRATIE_VINKJES = ['voorwaarden', 'leeftijd', 'nieuwsbrief'] as const
