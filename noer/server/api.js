// De API. Twaalf eindpunten: een account, een abonnement, en de vraag die de
// app stelt — mag dit kind bij het betaalde deel?

import {
  hashWachtwoord, keurEmail, keurWachtwoord, klopWachtwoord, leesSessie,
  maakSessie, nieuwId, Teller,
} from './accounts.js';
import { hervat, startAbonnement, toegangVan, verwerkWebhook, zegOp } from './abonnement.js';
import { PLANNEN, PROEF } from './instellingen.js';
import { koekje, koekjes, leesFormulier, leesJson, stuurJson } from './http.js';
import { normaliseerEmail } from './opslag.js';

const KOEKJE = 'noer_sessie';
const DERTIG_DAGEN = 30 * 24 * 3600;

/**
 * Wat iedereen mag, ook zonder abonnement. De app kent deze lijst zelf ook —
 * hij moet immers offline werken — maar hij komt hiervandaan, zodat je hem op
 * één plek kunt verruimen zonder de app opnieuw uit te geven.
 */
export const GRATIS = {
  letters: 'alles',
  lessen: ['losse-letters', 'verbonden-letters'],
  soeras: ['al-fatiha', 'an-nas', 'al-ikhlas'],
  themas: ['groeten'],
};

export function maakApi({ opslag, mollie, instellingen, post = null, log = console.log }) {
  const inlogTeller = new Teller({ max: 10, venster: 15 * 60 * 1000 });
  const aanmeldTeller = new Teller({ max: 20, venster: 60 * 60 * 1000 });
  const veiligKoekje = instellingen.basisUrl.startsWith('https://');
  const diensten = { opslag, mollie, instellingen, post, log };

  const huidigAccount = (verzoek) => {
    const id = leesSessie(koekjes(verzoek)[KOEKJE], instellingen.geheim);
    return id ? opslag.account(id) : null;
  };

  const zetSessie = (accountId) => ({
    'set-cookie': koekje(KOEKJE, maakSessie(accountId, instellingen.geheim),
      { maxLeeftijd: DERTIG_DAGEN, veilig: veiligKoekje }),
  });

  const publiekAccount = (account) => ({
    email: account.email,
    aangemaakt: account.aangemaakt,
    abonnement: {
      ...toegangVan(account),
      prijs: PLANNEN[account.abonnement?.plan]?.bedrag || null,
      periode: PLANNEN[account.abonnement?.plan]?.periode || null,
    },
    betalingen: (account.betalingen || []).slice(-12).reverse()
      .map(({ id, status, bedrag, op }) => ({ id, status, bedrag, op })),
  });

  /**
   * Geeft `true` als dit verzoek geen deel mag nemen aan iets dat gegevens
   * verandert. Een POST met JSON kan een andere website niet zomaar namens de
   * ouder doen — daarvoor moet de browser eerst om toestemming vragen — en
   * SameSite=Lax houdt het koekje sowieso thuis. Samen is dat de bescherming
   * tegen een verzoek dat van een vreemde site komt.
   */
  const verkeerdeHerkomst = (verzoek) => {
    const soort = String(verzoek.headers['content-type'] || '').split(';')[0].trim();
    if (soort !== 'application/json') return true;
    const herkomst = verzoek.headers.origin;
    if (!herkomst) return false;                      // geen browser, of same-origin
    return herkomst !== instellingen.basisUrl && !instellingen.proef;
  };

  return async function api(verzoek, antwoord, pad) {
    const methode = verzoek.method;

    // --- Wat de app wil weten -------------------------------------------
    if (pad === '/api/toegang' && methode === 'GET') {
      const account = huidigAccount(verzoek);
      return stuurJson(antwoord, 200, {
        ingelogd: Boolean(account),
        gratis: GRATIS,
        proefweek: PROEF.dagen,
        ...(account ? toegangVan(account) : { actief: false, staat: 'geen', plan: null, tot: null }),
      });
    }

    if (pad === '/api/status' && methode === 'GET') {
      return stuurJson(antwoord, 200, {
        draait: true,
        proefstand: instellingen.proef,
        proefweek: { dagen: PROEF.dagen, verificatiebedrag: PROEF.verificatiebedrag },
        plannen: Object.values(PLANNEN).map(({ id, naam, bedrag, periode }) => ({ id, naam, bedrag, periode })),
      });
    }

    // --- Mollie klopt aan -------------------------------------------------
    if (pad === '/api/mollie/webhook' && methode === 'POST') {
      // Mollie stuurt alleen een id. De stand halen we zelf op bij Mollie, dus
      // een verzonnen webhook levert niets op. Altijd 200 terug: een foutcode
      // laat Mollie het uren blijven proberen.
      const velden = await leesFormulier(verzoek);
      if (!velden.id) return stuurJson(antwoord, 200, { ontvangen: false });
      try {
        const uit = await verwerkWebhook(diensten, velden.id);
        log(`webhook ${velden.id}: ${uit.bekend ? uit.status || 'verwerkt' : 'onbekend account'}`);
      } catch (fout) {
        log(`webhook ${velden.id} mislukte: ${fout.message}`);
      }
      return stuurJson(antwoord, 200, { ontvangen: true });
    }

    /**
     * Alleen in de proefstand: de betaling afronden zoals de ouder dat in zijn
     * bank zou doen. Zonder dit is de betaalde kant van de app niet te testen
     * in een browser, want het afrekenen gebeurt bij Mollie.
     *
     * Dit eindpunt bestaat niet als NOER_PROEF uit staat — en er is een test
     * die dat controleert.
     */
    if (instellingen.proef && pad === '/api/proef/betaal' && methode === 'POST') {
      const account = huidigAccount(verzoek);
      if (!account) return stuurJson(antwoord, 401, { fout: 'Je bent niet ingelogd.' });
      const betalingId = account.abonnement?.eersteBetaling;
      if (!betalingId || typeof mollie.betaal !== 'function') {
        return stuurJson(antwoord, 409, { fout: 'Er staat geen betaling klaar.' });
      }
      const { gelukt = true } = await leesJson(verzoek);
      if (gelukt) mollie.betaal(betalingId); else mollie.mislukt(betalingId, 'canceled');
      await verwerkWebhook(diensten, betalingId);
      return stuurJson(antwoord, 200, { betaald: gelukt, ...toegangVan(opslag.account(account.id)) });
    }

    // --- Alles hieronder verandert iets ----------------------------------
    if (methode === 'POST' && verkeerdeHerkomst(verzoek)) {
      return stuurJson(antwoord, 400, { fout: 'Onverwacht verzoek.' });
    }

    if (pad === '/api/account/registreren' && methode === 'POST') {
      const { email, wachtwoord } = await leesJson(verzoek);
      const foutEmail = keurEmail(email);
      if (foutEmail) return stuurJson(antwoord, 400, { fout: foutEmail });
      const foutWachtwoord = keurWachtwoord(wachtwoord);
      if (foutWachtwoord) return stuurJson(antwoord, 400, { fout: foutWachtwoord });

      const sleutel = normaliseerEmail(email);
      if (aanmeldTeller.teVaak(sleutel)) {
        return stuurJson(antwoord, 429, { fout: 'Te veel pogingen. Probeer het later opnieuw.' });
      }
      aanmeldTeller.tel(sleutel);

      if (opslag.accountOpEmail(email)) {
        return stuurJson(antwoord, 409, { fout: 'Op dit adres bestaat al een account. Log in.' });
      }
      const account = await opslag.zetAccount({
        id: nieuwId(),
        email: String(email).trim(),
        wachtwoord: await hashWachtwoord(wachtwoord),
        aangemaakt: new Date().toISOString(),
        mollieKlant: null,
        abonnement: null,
        betalingen: [],
      });
      return stuurJson(antwoord, 201, { account: publiekAccount(account) }, zetSessie(account.id));
    }

    if (pad === '/api/account/inloggen' && methode === 'POST') {
      const { email, wachtwoord } = await leesJson(verzoek);
      const sleutel = normaliseerEmail(email);
      if (inlogTeller.teVaak(sleutel)) {
        return stuurJson(antwoord, 429, { fout: 'Te veel pogingen. Probeer het over een kwartier opnieuw.' });
      }
      const account = opslag.accountOpEmail(email);
      const goed = account && await klopWachtwoord(wachtwoord || '', account.wachtwoord);
      if (!goed) {
        inlogTeller.tel(sleutel);
        // Niet verklappen welke helft er fout was.
        return stuurJson(antwoord, 401, { fout: 'Dat e-mailadres en wachtwoord horen niet bij elkaar.' });
      }
      inlogTeller.vergeet(sleutel);
      return stuurJson(antwoord, 200, { account: publiekAccount(account) }, zetSessie(account.id));
    }

    if (pad === '/api/account/uitloggen' && methode === 'POST') {
      return stuurJson(antwoord, 200, { uitgelogd: true }, {
        'set-cookie': koekje(KOEKJE, '', { maxLeeftijd: 0, veilig: veiligKoekje }),
      });
    }

    // --- Hieronder moet je ingelogd zijn ---------------------------------
    const account = huidigAccount(verzoek);
    if (pad.startsWith('/api/account') || pad.startsWith('/api/abonnement')) {
      if (!account) return stuurJson(antwoord, 401, { fout: 'Je bent niet ingelogd.' });
    }

    if (pad === '/api/account' && methode === 'GET') {
      return stuurJson(antwoord, 200, { account: publiekAccount(account) });
    }

    if (pad === '/api/account/wachtwoord' && methode === 'POST') {
      const { oud, nieuw } = await leesJson(verzoek);
      if (!await klopWachtwoord(oud || '', account.wachtwoord)) {
        return stuurJson(antwoord, 401, { fout: 'Je huidige wachtwoord klopt niet.' });
      }
      const keur = keurWachtwoord(nieuw);
      if (keur) return stuurJson(antwoord, 400, { fout: keur });
      account.wachtwoord = await hashWachtwoord(nieuw);
      await opslag.zetAccount(account);
      return stuurJson(antwoord, 200, { gewijzigd: true });
    }

    if (pad === '/api/abonnement/starten' && methode === 'POST') {
      const { plan } = await leesJson(verzoek);
      if (!PLANNEN[plan]) return stuurJson(antwoord, 400, { fout: 'Kies een geldig abonnement.' });
      if (toegangVan(account).actief && account.abonnement?.staat === 'actief') {
        return stuurJson(antwoord, 409, { fout: 'Je hebt al een lopend abonnement.' });
      }
      try {
        const { betaalUrl } = await startAbonnement(diensten, account, plan);
        if (!betaalUrl) return stuurJson(antwoord, 502, { fout: 'Mollie gaf geen betaallink terug.' });
        return stuurJson(antwoord, 200, { betaalUrl });
      } catch (fout) {
        log(`betaling starten mislukte voor ${account.id}: ${fout.message}`);
        return stuurJson(antwoord, 502, { fout: 'De betaling kon niet worden gestart. Probeer het zo nog eens.' });
      }
    }

    if (pad === '/api/abonnement/opzeggen' && methode === 'POST') {
      const uit = await zegOp(diensten, account);
      return stuurJson(antwoord, 200, { abonnement: uit });
    }

    if (pad === '/api/abonnement/hervatten' && methode === 'POST') {
      try {
        return stuurJson(antwoord, 200, await hervat(diensten, account));
      } catch (fout) {
        log(`hervatten mislukte voor ${account.id}: ${fout.message}`);
        return stuurJson(antwoord, 502, { fout: 'Hervatten lukte niet. Neem contact op.' });
      }
    }

    return stuurJson(antwoord, 404, { fout: 'Dit eindpunt bestaat niet.' });
  };
}
