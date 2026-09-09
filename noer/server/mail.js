// E-mail versturen. Niet omdat het leuk is, maar omdat het moet: als iemand
// online een abonnement afsluit, hoort hij een bevestiging te krijgen die hij
// kan bewaren (artikel 6:230v BW). Een scherm dat "gelukt" zegt is dat niet.
//
// Er zit geen mailbibliotheek in. Beide diensten hieronder hebben een HTTP-api,
// en Node kan fetch. Kies er een, zet twee omgevingsvariabelen, klaar:
//
//   NOER_MAIL=resend    NOER_MAIL_SLEUTEL=re_...
//   NOER_MAIL=postmark  NOER_MAIL_SLEUTEL=...
//   NOER_MAIL_VAN="Noer <noer@jouwdomein.nl>"
//
// Staat NOER_MAIL niet ingesteld, dan schrijft de server de mail in de log en
// gaat gewoon door. Dat is met opzet: een abonnement mag niet stuklopen omdat
// een mailtje niet aankomt. Het staat wel in de log, zodat je het ziet.

const DIENSTEN = {
  resend: {
    url: 'https://api.resend.com/emails',
    koppen: (sleutel) => ({ authorization: `Bearer ${sleutel}`, 'content-type': 'application/json' }),
    lichaam: ({ van, aan, onderwerp, tekst }) => ({ from: van, to: [aan], subject: onderwerp, text: tekst }),
  },
  postmark: {
    url: 'https://api.postmarkapp.com/email',
    koppen: (sleutel) => ({ 'X-Postmark-Server-Token': sleutel, 'content-type': 'application/json', accept: 'application/json' }),
    lichaam: ({ van, aan, onderwerp, tekst }) => ({ From: van, To: aan, Subject: onderwerp, TextBody: tekst, MessageStream: 'outbound' }),
  },
};

export function maakPost({ dienst, sleutel, van, log = console.log, haal = fetch }) {
  const opzet = DIENSTEN[dienst];

  return async function stuur({ aan, onderwerp, tekst }) {
    if (!opzet || !sleutel) {
      log(`[mail, niet verstuurd] aan ${aan}: ${onderwerp}`);
      return { verstuurd: false, reden: 'geen maildienst ingesteld' };
    }
    try {
      const antwoord = await haal(opzet.url, {
        method: 'POST',
        headers: opzet.koppen(sleutel),
        body: JSON.stringify(opzet.lichaam({ van, aan, onderwerp, tekst })),
      });
      if (!antwoord.ok) {
        log(`[mail mislukt ${antwoord.status}] aan ${aan}: ${onderwerp}`);
        return { verstuurd: false, reden: `${antwoord.status}` };
      }
      return { verstuurd: true };
    } catch (fout) {
      // Een mail die niet aankomt mag een betaling niet ongedaan maken.
      log(`[mail mislukt] aan ${aan}: ${fout.message}`);
      return { verstuurd: false, reden: fout.message };
    }
  };
}

// --- De drie berichten ----------------------------------------------------
//
// Kort, zonder opsmuk, en met alles erin wat er wettelijk in hoort: wat je
// hebt gekocht, wat het kost, hoe vaak het wordt afgeschreven, en hoe je
// eraf komt.

export const BERICHTEN = {
  welkom: ({ plan, bedrag, tot, site }) => ({
    onderwerp: 'Je abonnement op Noer',
    tekst: [
      'Assalaamoe ʿalaikoem,',
      '',
      'Je abonnement op Noer staat aan. Alles is nu open: de tien leeslessen, alle',
      "soera's, de woordthema's, de opnamestudio en het ouderscherm.",
      '',
      `Wat je hebt afgesloten: Noer ${plan === 'jaar' ? 'per jaar' : 'per maand'}, € ${bedrag} ${plan === 'jaar' ? 'per jaar' : 'per maand'}, inclusief btw.`,
      `De volgende afschrijving is rond ${tot}.`,
      '',
      'Opzeggen kan op elk moment met één knop in je account. Je houdt dan toegang',
      'tot het eind van de periode die je al betaald hebt.',
      '',
      `Je account:      ${site}/account.html`,
      `Noer openen:     ${site}/app/`,
      `Op je beginscherm zetten: ${site}/installeren.html`,
      `De voorwaarden:  ${site}/voorwaarden.html`,
      '',
      'Bewaar deze mail; hij is de bevestiging van je aankoop.',
      '',
      'Veel plezier samen,',
      'Noer',
    ].join('\n'),
  }),

  mislukt: ({ site }) => ({
    onderwerp: 'De betaling voor Noer is niet doorgegaan',
    tekst: [
      'Assalaamoe ʿalaikoem,',
      '',
      'De betaling voor je abonnement op Noer is niet gelukt. Er is niets',
      'afgeschreven — dat gebeurt weleens, bijvoorbeeld als een scherm te lang',
      'openstaat.',
      '',
      `Opnieuw proberen: ${site}/aanmelden.html`,
      '',
      'Het gratis deel blijft ondertussen gewoon werken: het hele alfabet, de eerste',
      "twee leeslessen, Al-Faatiha, Al-Ichlaas, An-Naas en één woordthema.",
      '',
      'Noer',
    ].join('\n'),
  }),

  opgezegd: ({ tot, site }) => ({
    onderwerp: 'Je abonnement op Noer is opgezegd',
    tekst: [
      'Assalaamoe ʿalaikoem,',
      '',
      'Je abonnement is opgezegd. Er wordt niets meer afgeschreven.',
      '',
      `Je kunt nog tot ${tot} bij alles. Daarna blijft het gratis deel gewoon`,
      'werken, en blijft de voortgang van je kind op je apparaat staan.',
      '',
      `Bedenk je je voor die tijd, dan zet je het weer aan zonder extra kosten: ${site}/account.html`,
      '',
      'Bedankt dat je het geprobeerd hebt.',
      'Noer',
    ].join('\n'),
  }),
};
