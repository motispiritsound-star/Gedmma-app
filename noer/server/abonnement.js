// Het abonnement zelf: wanneer iemand toegang heeft, en wat er gebeurt als
// Mollie iets meldt.
//
// De regel is kort: een account heeft toegang zolang `betaaldTot` in de
// toekomst ligt. Opzeggen zet die datum niet terug — je hebt de maand betaald,
// dus je maakt de maand af. Dat is ook wat er op de site staat.

import { PLANNEN } from './instellingen.js';
import { MollieFout } from './mollie.js';

export const leegAbonnement = () => ({
  plan: null,
  staat: 'geen',          // geen | wacht | actief | opgezegd | mislukt
  mollieAbonnement: null,
  eersteBetaling: null,
  laatsteBetaling: null,
  betaaldTot: null,
  opgezegdOp: null,
});

/**
 * Een periode bij een datum optellen. Een maand later op 31 januari is
 * 28 februari, niet 3 maart: eerst de maand ophogen, dan de dag terugzetten
 * als die maand korter is.
 */
export function plusPeriode(datum, interval) {
  const maanden = interval === '12 months' ? 12 : 1;
  const d = new Date(datum);
  const dag = d.getUTCDate();
  const doel = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + maanden, 1,
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  const laatsteDag = new Date(Date.UTC(doel.getUTCFullYear(), doel.getUTCMonth() + 1, 0)).getUTCDate();
  doel.setUTCDate(Math.min(dag, laatsteDag));
  return doel;
}

export const alsDatum = (d) => new Date(d).toISOString().slice(0, 10);

/** Wat de app moet weten: mag dit account bij het betaalde deel? */
export function toegangVan(account, nu = Date.now()) {
  const ab = account?.abonnement || leegAbonnement();
  const tot = ab.betaaldTot ? Date.parse(ab.betaaldTot) : 0;
  return {
    actief: tot > nu,
    staat: ab.staat,
    plan: ab.plan,
    tot: ab.betaaldTot,
    opgezegd: ab.staat === 'opgezegd',
  };
}

/**
 * Stap 1 en 2: zorgen dat er een Mollie-klant is en de eerste betaling klaarzetten.
 * Geeft terug waar de ouder heen moet om te betalen.
 */
export async function startAbonnement({ mollie, opslag, instellingen }, account, planId) {
  const plan = PLANNEN[planId];
  if (!plan) throw new Error(`Onbekend plan: ${planId}`);

  if (!account.mollieKlant) {
    const klant = await mollie.maakKlant({ email: account.email });
    account.mollieKlant = klant.id;
    await opslag.zetAccount(account);
  }

  const betaling = await mollie.maakEersteBetaling(account.mollieKlant, {
    bedrag: plan.bedrag,
    omschrijving: plan.omschrijving,
    terugUrl: `${instellingen.basisUrl}/bedankt.html`,
    webhookUrl: `${instellingen.basisUrl}/api/mollie/webhook`,
    metadata: { accountId: account.id, plan: plan.id },
  });

  account.abonnement = {
    ...leegAbonnement(),
    ...account.abonnement,
    plan: plan.id,
    staat: 'wacht',
    eersteBetaling: betaling.id,
  };
  await opslag.zetAccount(account);

  return { betaling, betaalUrl: betaling._links?.checkout?.href || null };
}

/**
 * Wat Mollie ons stuurt is alleen een betalings-id; de stand halen we zelf op.
 * Dat is met opzet zo: dan kan niemand met een verzonnen webhook een
 * abonnement aanzetten.
 */
export async function verwerkWebhook({ mollie, opslag, instellingen, log = () => {} }, betalingId) {
  const betaling = await mollie.betaling(betalingId);
  const accountId = betaling.metadata?.accountId;
  const account = (accountId && opslag.account(accountId))
    || (betaling.customerId && opslag.accountOpKlant(betaling.customerId));
  if (!account) {
    log(`webhook voor onbekend account: ${betalingId}`);
    return { bekend: false };
  }

  const ab = { ...leegAbonnement(), ...account.abonnement };
  account.betalingen = account.betalingen || [];

  // Twee keer dezelfde betaling verwerken zou een maand cadeau geven. Mollie
  // roept de webhook meer dan eens aan; dat hoort erbij.
  const eerder = account.betalingen.find((b) => b.id === betaling.id);
  if (eerder && eerder.status === betaling.status) {
    return { bekend: true, herhaling: true, toegang: toegangVan(account) };
  }

  const regel = {
    id: betaling.id,
    status: betaling.status,
    bedrag: betaling.amount?.value ?? null,
    soort: betaling.sequenceType || 'oneoff',
    op: new Date().toISOString(),
  };
  if (eerder) Object.assign(eerder, regel); else account.betalingen.push(regel);
  if (account.betalingen.length > 60) account.betalingen = account.betalingen.slice(-60);

  if (betaling.status === 'paid') {
    const plan = PLANNEN[betaling.metadata?.plan || ab.plan] || PLANNEN.maand;
    const vanaf = ab.betaaldTot && Date.parse(ab.betaaldTot) > Date.now()
      ? new Date(ab.betaaldTot) : new Date();
    ab.plan = plan.id;
    ab.betaaldTot = plusPeriode(vanaf, plan.interval).toISOString();
    ab.laatsteBetaling = betaling.id;
    if (ab.staat !== 'opgezegd') ab.staat = 'actief';

    // Na de eerste betaling staat er een mandaat, en pas dan mag het
    // abonnement worden aangemaakt. De eerste incasso is aan het eind van
    // deze periode, want die is nu net betaald.
    if (betaling.sequenceType === 'first' && !ab.mollieAbonnement) {
      try {
        const nieuw = await mollie.maakAbonnement(account.mollieKlant, {
          bedrag: plan.bedrag,
          interval: plan.interval,
          omschrijving: plan.omschrijving,
          startDatum: alsDatum(ab.betaaldTot),
          webhookUrl: `${instellingen.basisUrl}/api/mollie/webhook`,
          mandaatId: betaling.mandateId || undefined,
        });
        ab.mollieAbonnement = nieuw.id;
      } catch (fout) {
        // De ouder heeft betaald; die krijgt zijn maand. Dat het abonnement
        // niet doorloopt is een probleem voor later, en het moet opvallen.
        ab.staat = 'actief';
        ab.abonnementFout = fout instanceof MollieFout ? fout.message : String(fout);
        log(`abonnement aanmaken mislukt voor ${account.id}: ${ab.abonnementFout}`);
      }
    }
  } else if (['failed', 'canceled', 'expired'].includes(betaling.status)) {
    // Een mislukte eerste betaling betekent: er is niets. Een mislukte
    // incasso later laat de lopende periode staan — Mollie probeert het zelf
    // nog een paar keer.
    if (betaling.sequenceType === 'first' && ab.staat === 'wacht') ab.staat = 'mislukt';
  }

  account.abonnement = ab;
  await opslag.zetAccount(account);
  return { bekend: true, toegang: toegangVan(account), status: betaling.status };
}

/**
 * Opzeggen. Bij Mollie stopt de incasso meteen; bij ons loopt de toegang door
 * tot het eind van de periode die al betaald is.
 */
export async function zegOp({ mollie, opslag }, account) {
  const ab = { ...leegAbonnement(), ...account.abonnement };
  if (ab.mollieAbonnement && account.mollieKlant) {
    try {
      await mollie.zegAbonnementOp(account.mollieKlant, ab.mollieAbonnement);
    } catch (fout) {
      // Al opgezegd bij Mollie, of het abonnement bestaat daar niet meer.
      // Dan is het doel bereikt; alleen een echte storing gaat door.
      if (!(fout instanceof MollieFout) || fout.status >= 500) throw fout;
    }
  }
  ab.staat = 'opgezegd';
  ab.opgezegdOp = new Date().toISOString();
  account.abonnement = ab;
  await opslag.zetAccount(account);
  return toegangVan(account);
}

/** Weer aanzetten voordat de periode voorbij is: dan hoeft er niets betaald. */
export async function hervat({ mollie, opslag, instellingen }, account) {
  const ab = { ...leegAbonnement(), ...account.abonnement };
  const plan = PLANNEN[ab.plan] || PLANNEN.maand;
  if (!ab.betaaldTot || Date.parse(ab.betaaldTot) <= Date.now()) {
    return { hervat: false, reden: 'verlopen' };
  }
  const nieuw = await mollie.maakAbonnement(account.mollieKlant, {
    bedrag: plan.bedrag,
    interval: plan.interval,
    omschrijving: plan.omschrijving,
    startDatum: alsDatum(ab.betaaldTot),
    webhookUrl: `${instellingen.basisUrl}/api/mollie/webhook`,
  });
  ab.mollieAbonnement = nieuw.id;
  ab.staat = 'actief';
  ab.opgezegdOp = null;
  account.abonnement = ab;
  await opslag.zetAccount(account);
  return { hervat: true, toegang: toegangVan(account) };
}
