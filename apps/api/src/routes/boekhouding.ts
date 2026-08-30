/** Routes voor relaties, verkoop, inkoop, bank, documenten, rapportage en audit. */
import { Router } from 'express';
import { Money } from '@gedmma/money';
import { z, valideer, aantalSchema, bedragSchema, datumSchema, uuidSchema } from '../http/valideer.ts';
import { eisAangemeld, type Verzoek } from '../http/context.ts';
import { administratieContext, eisAanmelding, vereistRecht } from '../http/middleware.ts';
import { ApiFout, fout } from '../http/fout.ts';
import { asyncRoute, inContext, inContextIdempotent, verwachteVersie } from './hulp.ts';
import { eisSchrijfbaar, leesAdministratie } from '../modules/organisaties/service.ts';
import {
  leesContact,
  maakContact,
  wijzigContact,
  zoekContacten,
  zoekMogelijkeDubbelen,
} from '../modules/relaties/service.ts';
import {
  crediteer,
  leesFactuur,
  maakDefinitief,
  maakFactuur,
  offerteNaarFactuur,
  wijzigFactuur,
  zoekFacturen,
} from '../modules/verkoop/service.ts';
import { maakPdf, maakUblBestand, verstuurFactuur } from '../modules/verkoop/verzenden.ts';
import {
  leesInkoopfactuur,
  maakInkoopDefinitief,
  maakInkoopfactuur,
  ontbrekendeBonnen,
  zoekInkoopfacturen,
} from '../modules/inkoop/service.ts';
import {
  bankrekeningen,
  boekTransactie,
  importeerBestand,
  leesTransactie,
  maakBankrekening,
  pasRegelsToe,
  reconciliatie,
  zoekMatches,
  zoekTransacties,
} from '../modules/bank/service.ts';
import { downloadDocument, uploadDocument, zoekDocumenten } from '../modules/documenten/service.ts';
import {
  balans,
  grootboekkaart,
  journaal,
  ouderdomsanalyse,
  saldibalans,
  winstEnVerlies,
} from '../modules/rapportage/service.ts';
import { btwOverzicht, icpOverzicht } from '../modules/btw/service.ts';
import { controleerKetting, leesAudit, auditeer } from '../modules/audit/service.ts';
import { leesPost } from '../modules/grootboek/repo.ts';
import { storneer } from '../modules/grootboek/service.ts';

export const boekhoudRoutes = Router({ mergeParams: true });

boekhoudRoutes.use(eisAanmelding, administratieContext);

/** Weigert schrijfacties in een administratie die op alleen-lezen staat. */
async function eisSchrijven(verzoek: Verzoek): Promise<void> {
  await inContext(verzoek, async (client, context) => {
    eisSchrijfbaar(await leesAdministratie(client, context.administratieId));
  });
}

// --- Relaties --------------------------------------------------------------

const contactSchema = z.object({
  naam: z.string().min(2, 'Vul de naam van de relatie in').max(200),
  soort: z.enum(['klant', 'leverancier', 'beide']).default('klant'),
  email: z.string().email('Vul een geldig e-mailadres in').nullish(),
  telefoon: z.string().max(40).nullish(),
  website: z.string().max(200).nullish(),
  kvkNummer: z.string().max(20).nullish(),
  btwNummer: z.string().max(30).nullish(),
  iban: z.string().max(40).nullish(),
  land: z.string().length(2).default('NL'),
  betalingstermijnDagen: z.number().int().min(0).max(365).default(30),
  kredietlimiet: bedragSchema.nullish(),
  notitie: z.string().max(2000).nullish(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  adres: z
    .object({
      adres: z.string().max(200).optional(),
      postcode: z.string().max(20).optional(),
      plaats: z.string().max(100).optional(),
      land: z.string().length(2).optional(),
    })
    .nullish(),
  negeerDubbel: z.boolean().default(false),
});

boekhoudRoutes.get(
  '/relaties',
  vereistRecht('relatie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({
        zoek: z.string().max(100).optional(),
        soort: z.enum(['klant', 'leverancier']).optional(),
        limiet: z.coerce.number().int().min(1).max(200).default(50),
        cursor: z.string().optional(),
      }),
      verzoek.query,
    );
    const uitkomst = await inContext(verzoek, (client, context) =>
      zoekContacten(client, context.administratieId, opdracht),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.post(
  '/relaties',
  vereistRecht('relatie.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(contactSchema, verzoek.body);
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) =>
      maakContact(client, context, invoer, { negeerDubbel: invoer.negeerDubbel }),
    );
  }),
);

boekhoudRoutes.get(
  '/relaties/:id',
  vereistRecht('relatie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const contact = await inContext(verzoek, (client, context) => leesContact(client, context.administratieId, id));
    antwoord.json({ relatie: contact });
  }),
);

boekhoudRoutes.patch(
  '/relaties/:id',
  vereistRecht('relatie.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(contactSchema.partial(), verzoek.body);
    const uitkomst = await inContext(verzoek, async (client, context) => {
      await wijzigContact(client, context, id, invoer, verwachteVersie(verzoek));
      return leesContact(client, context.administratieId, id);
    });
    antwoord.json({ relatie: uitkomst });
  }),
);

boekhoudRoutes.get(
  '/relaties/dubbelcheck',
  vereistRecht('relatie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const naam = valideer(z.string().min(2).max(200), verzoek.query.naam);
    const dubbelen = await inContext(verzoek, (client, context) =>
      zoekMogelijkeDubbelen(client, context.administratieId, naam),
    );
    antwoord.json({ mogelijkeDubbelen: dubbelen });
  }),
);

// --- Verkoop ---------------------------------------------------------------

const factuurRegelSchema = z.object({
  omschrijving: z.string().min(1, 'Vul in wat je hebt geleverd').max(500),
  aantal: aantalSchema.default('1'),
  eenheid: z.string().max(20).default('stuk'),
  prijs: bedragSchema,
  korting: bedragSchema.optional(),
  btwCodeId: uuidSchema,
  rekeningId: uuidSchema,
  productId: uuidSchema.nullish(),
  inclusiefBtw: z.boolean().default(false),
});

const factuurSchema = z.object({
  contactId: uuidSchema,
  soort: z.enum(['offerte', 'factuur', 'creditnota', 'proforma']).default('factuur'),
  factuurdatum: datumSchema,
  leverdatum: datumSchema.nullish(),
  vervaldatum: datumSchema.nullish(),
  referentie: z.string().max(200).nullish(),
  notitie: z.string().max(2000).nullish(),
  valuta: z.string().length(3).optional(),
  regels: z.array(factuurRegelSchema).min(1, 'Een factuur heeft minimaal een regel').max(200),
});

boekhoudRoutes.get(
  '/verkoopfacturen',
  vereistRecht('verkoop.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({
        status: z.string().max(30).optional(),
        soort: z.enum(['offerte', 'factuur', 'creditnota', 'proforma']).optional(),
        contactId: uuidSchema.optional(),
        vanaf: datumSchema.optional(),
        tot: datumSchema.optional(),
        openstaand: z.coerce.boolean().optional(),
        limiet: z.coerce.number().int().min(1).max(200).default(50),
        cursor: z.string().optional(),
      }),
      verzoek.query,
    );
    const uitkomst = await inContext(verzoek, (client, context) =>
      zoekFacturen(client, context.administratieId, opdracht),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.post(
  '/verkoopfacturen',
  vereistRecht('verkoop.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(factuurSchema, verzoek.body);
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) => maakFactuur(client, context, invoer));
  }),
);

boekhoudRoutes.get(
  '/verkoopfacturen/:id',
  vereistRecht('verkoop.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const uitkomst = await inContext(verzoek, (client, context) => leesFactuur(client, context.administratieId, id));
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.put(
  '/verkoopfacturen/:id',
  vereistRecht('verkoop.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(factuurSchema, verzoek.body);
    const uitkomst = await inContext(verzoek, async (client, context) => {
      await wijzigFactuur(client, context, id, invoer, verwachteVersie(verzoek));
      return leesFactuur(client, context.administratieId, id);
    });
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.post(
  '/verkoopfacturen/:id/definitief',
  vereistRecht('journaal.definitief'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    await inContextIdempotent(verzoek, antwoord, 200, (client, context) => maakDefinitief(client, context, id));
  }),
);

boekhoudRoutes.post(
  '/verkoopfacturen/:id/crediteer',
  vereistRecht('verkoop.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(
      z.object({ datum: datumSchema.optional(), reden: z.string().max(500).optional() }),
      verzoek.body ?? {},
    );
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) => crediteer(client, context, id, invoer));
  }),
);

boekhoudRoutes.post(
  '/verkoopfacturen/:id/naar-factuur',
  vereistRecht('verkoop.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) => offerteNaarFactuur(client, context, id));
  }),
);

boekhoudRoutes.get(
  '/verkoopfacturen/:id/pdf',
  vereistRecht('verkoop.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const pdf = await inContext(verzoek, (client, context) => maakPdf(client, context, id));
    antwoord.setHeader('Content-Type', 'application/pdf');
    antwoord.setHeader('Content-Disposition', `inline; filename="${pdf.bestandsnaam}"`);
    antwoord.send(pdf.inhoud);
  }),
);

boekhoudRoutes.get(
  '/verkoopfacturen/:id/ubl',
  vereistRecht('verkoop.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const ubl = await inContext(verzoek, (client, context) =>
      maakUblBestand(client, context.administratieId, id),
    );
    antwoord.setHeader('Content-Type', 'application/xml; charset=utf-8');
    antwoord.setHeader('Content-Disposition', `attachment; filename="${ubl.bestandsnaam}"`);
    antwoord.send(ubl.xml);
  }),
);

boekhoudRoutes.post(
  '/verkoopfacturen/:id/verstuur',
  vereistRecht('verkoop.versturen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(
      z.object({
        aan: z.string().email().optional(),
        onderwerp: z.string().max(200).optional(),
        tekst: z.string().max(5000).optional(),
      }),
      verzoek.body ?? {},
    );
    const uitkomst = await inContext(verzoek, (client, context) => verstuurFactuur(client, context, id, invoer));
    antwoord.json(uitkomst);
  }),
);

// --- Inkoop ----------------------------------------------------------------

const inkoopSchema = z.object({
  contactId: uuidSchema,
  soort: z.enum(['factuur', 'creditnota']).default('factuur'),
  leveranciersnummer: z.string().max(60).nullish(),
  factuurdatum: datumSchema,
  ontvangstdatum: datumSchema.nullish(),
  vervaldatum: datumSchema.nullish(),
  omschrijving: z.string().max(500).nullish(),
  valuta: z.string().length(3).optional(),
  documentId: uuidSchema.nullish(),
  regels: z
    .array(
      z.object({
        omschrijving: z.string().min(1).max(500),
        aantal: aantalSchema.optional(),
        prijs: bedragSchema,
        korting: bedragSchema.optional(),
        btwCodeId: uuidSchema,
        rekeningId: uuidSchema,
        inclusiefBtw: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(200),
});

boekhoudRoutes.get(
  '/inkoopfacturen',
  vereistRecht('inkoop.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({
        status: z.string().max(30).optional(),
        contactId: uuidSchema.optional(),
        openstaand: z.coerce.boolean().optional(),
        limiet: z.coerce.number().int().min(1).max(200).default(50),
      }),
      verzoek.query,
    );
    const items = await inContext(verzoek, (client, context) =>
      zoekInkoopfacturen(client, context.administratieId, opdracht),
    );
    antwoord.json({ items });
  }),
);

boekhoudRoutes.post(
  '/inkoopfacturen',
  vereistRecht('inkoop.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(inkoopSchema, verzoek.body);
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) =>
      maakInkoopfactuur(client, context, invoer),
    );
  }),
);

boekhoudRoutes.get(
  '/inkoopfacturen/:id',
  vereistRecht('inkoop.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const uitkomst = await inContext(verzoek, (client, context) =>
      leesInkoopfactuur(client, context.administratieId, id),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.post(
  '/inkoopfacturen/:id/definitief',
  vereistRecht('journaal.definitief'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    await inContextIdempotent(verzoek, antwoord, 200, (client, context) =>
      maakInkoopDefinitief(client, context, id),
    );
  }),
);

boekhoudRoutes.get(
  '/ontbrekende-bonnen',
  vereistRecht('inkoop.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const items = await inContext(verzoek, (client, context) =>
      ontbrekendeBonnen(client, context.administratieId),
    );
    antwoord.json({ items });
  }),
);

// --- Documenten ------------------------------------------------------------

boekhoudRoutes.post(
  '/documenten',
  vereistRecht('document.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(
      z.object({
        bestandsnaam: z.string().min(1).max(255),
        mime: z.string().min(3).max(100),
        soort: z.string().max(50).default('bijlage'),
        classificatie: z.enum(['normaal', 'gevoelig']).default('normaal'),
        inhoudBase64: z.string().min(1, 'Er is geen bestand meegestuurd'),
      }),
      verzoek.body,
    );
    const inhoud = Buffer.from(invoer.inhoudBase64, 'base64');
    const uitkomst = await inContext(verzoek, (client, context) =>
      uploadDocument(client, context, {
        inhoud,
        bestandsnaam: invoer.bestandsnaam,
        mime: invoer.mime,
        soort: invoer.soort,
        classificatie: invoer.classificatie,
      }),
    );
    antwoord.status(201).json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/documenten',
  vereistRecht('document.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opties = valideer(
      z.object({ soort: z.string().max(50).optional(), limiet: z.coerce.number().int().min(1).max(200).default(50) }),
      verzoek.query,
    );
    const documenten = await inContext(verzoek, (client, context) =>
      zoekDocumenten(client, context.administratieId, opties),
    );
    antwoord.json({ documenten });
  }),
);

boekhoudRoutes.get(
  '/documenten/:id/inhoud',
  vereistRecht('document.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const rechten = verzoek.werk?.rechten ?? new Set<string>();
    const uitkomst = await inContext(verzoek, (client, context) =>
      downloadDocument(client, context, id, rechten),
    );
    antwoord.setHeader('Content-Type', uitkomst.document.mime);
    antwoord.setHeader('Content-Disposition', `inline; filename="${uitkomst.document.bestandsnaam}"`);
    antwoord.send(uitkomst.inhoud);
  }),
);

// --- Bank ------------------------------------------------------------------

boekhoudRoutes.get(
  '/bankrekeningen',
  vereistRecht('bank.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const rekeningen = await inContext(verzoek, (client, context) =>
      bankrekeningen(client, context.administratieId),
    );
    antwoord.json({ bankrekeningen: rekeningen });
  }),
);

boekhoudRoutes.post(
  '/bankrekeningen',
  vereistRecht('bank.koppelen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(
      z.object({
        naam: z.string().min(2).max(100),
        iban: z.string().max(40).nullish(),
        valuta: z.string().length(3).default('EUR'),
        ledgerAccountId: uuidSchema,
        soort: z.enum(['bank', 'spaar', 'creditcard', 'betaalprovider', 'kas']).default('bank'),
      }),
      verzoek.body,
    );
    const uitkomst = await inContext(verzoek, (client, context) => maakBankrekening(client, context, invoer));
    antwoord.status(201).json(uitkomst);
  }),
);

boekhoudRoutes.post(
  '/bankrekeningen/:id/import',
  vereistRecht('bank.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const bankRekeningId = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(
      z.object({
        bestandsnaam: z.string().max(255).optional(),
        inhoudBase64: z.string().min(1).optional(),
        inhoud: z.string().min(1).optional(),
      }),
      verzoek.body,
    );
    const inhoud = invoer.inhoudBase64
      ? Buffer.from(invoer.inhoudBase64, 'base64').toString('utf8')
      : invoer.inhoud;
    if (!inhoud) {
      throw new ApiFout('validation_failed', 'Er is geen bestand meegestuurd.', 'Kies een bestand van je bank.');
    }
    const uitkomst = await inContext(verzoek, (client, context) =>
      importeerBestand(client, context, { bankRekeningId, inhoud, bestandsnaam: invoer.bestandsnaam }),
    );
    antwoord.status(201).json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/banktransacties',
  vereistRecht('bank.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opties = valideer(
      z.object({
        status: z.enum(['nieuw', 'voorstel', 'geboekt', 'genegeerd']).optional(),
        bankRekeningId: uuidSchema.optional(),
        vanaf: datumSchema.optional(),
        tot: datumSchema.optional(),
        limiet: z.coerce.number().int().min(1).max(200).default(50),
      }),
      verzoek.query,
    );
    const items = await inContext(verzoek, (client, context) =>
      zoekTransacties(client, context.administratieId, opties),
    );
    antwoord.json({ items });
  }),
);

boekhoudRoutes.get(
  '/banktransacties/:id/voorstellen',
  vereistRecht('bank.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const uitkomst = await inContext(verzoek, async (client, context) => {
      const transactie = await leesTransactie(client, context.administratieId, id);
      const matches = await zoekMatches(client, context.administratieId, transactie);
      const regel = await pasRegelsToe(client, context.administratieId, transactie);
      return { transactie, matches, regel };
    });
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.post(
  '/banktransacties/:id/boek',
  vereistRecht('bank.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(
      z.object({
        afletteringen: z
          .array(
            z.object({
              factuurSoort: z.enum(['verkoopfactuur', 'inkoopfactuur']),
              factuurId: uuidSchema,
              bedrag: bedragSchema,
            }),
          )
          .default([]),
        directeBoekingen: z
          .array(
            z.object({
              rekeningId: uuidSchema,
              bedrag: bedragSchema,
              omschrijving: z.string().max(500).optional(),
              btwCodeId: uuidSchema.nullish(),
            }),
          )
          .default([]),
      }),
      verzoek.body ?? {},
    );
    await inContextIdempotent(verzoek, antwoord, 200, (client, context) =>
      boekTransactie(client, context, { transactieId: id, ...invoer }),
    );
  }),
);

boekhoudRoutes.get(
  '/bankrekeningen/:id/reconciliatie',
  vereistRecht('bank.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const uitkomst = await inContext(verzoek, (client, context) =>
      reconciliatie(client, context.administratieId, id),
    );
    antwoord.json(uitkomst);
  }),
);

// --- Journaal --------------------------------------------------------------

boekhoudRoutes.get(
  '/journaalposten/:id',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const uitkomst = await inContext(verzoek, (client, context) => leesPost(client, context.administratieId, id));
    if (!uitkomst) throw fout.nietGevonden('Deze boeking');
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.post(
  '/journaalposten/:id/storneer',
  vereistRecht('journaal.storneren'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(
      z.object({ boekdatum: datumSchema.optional(), omschrijving: z.string().max(500).optional() }),
      verzoek.body ?? {},
    );
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) =>
      storneer(client, context, id, invoer),
    );
  }),
);

// --- Rapportages -----------------------------------------------------------

const periodeSchema = z.object({ vanaf: datumSchema, tot: datumSchema });

boekhoudRoutes.get(
  '/rapporten/balans',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const { peildatum } = valideer(z.object({ peildatum: datumSchema }), verzoek.query);
    const uitkomst = await inContext(verzoek, (client, context) =>
      balans(client, context.administratieId, peildatum),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/rapporten/winst-en-verlies',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      periodeSchema.extend({ vergelijkVanaf: datumSchema.optional(), vergelijkTot: datumSchema.optional() }),
      verzoek.query,
    );
    const vergelijk =
      opdracht.vergelijkVanaf && opdracht.vergelijkTot
        ? { vanaf: opdracht.vergelijkVanaf, tot: opdracht.vergelijkTot }
        : undefined;
    const uitkomst = await inContext(verzoek, (client, context) =>
      winstEnVerlies(client, context.administratieId, { vanaf: opdracht.vanaf, tot: opdracht.tot }, vergelijk),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/rapporten/saldibalans',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const periode = valideer(periodeSchema, verzoek.query);
    const uitkomst = await inContext(verzoek, (client, context) =>
      saldibalans(client, context.administratieId, periode),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/rapporten/grootboekkaart/:rekeningId',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const rekeningId = valideer(uuidSchema, verzoek.params.rekeningId);
    const periode = valideer(periodeSchema, verzoek.query);
    const uitkomst = await inContext(verzoek, (client, context) =>
      grootboekkaart(client, context.administratieId, rekeningId, periode),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/rapporten/journaal',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      periodeSchema.extend({
        dagboek: z.string().max(10).optional(),
        limiet: z.coerce.number().int().min(1).max(500).default(100),
      }),
      verzoek.query,
    );
    const items = await inContext(verzoek, (client, context) =>
      journaal(client, context.administratieId, { vanaf: opdracht.vanaf, tot: opdracht.tot }, opdracht),
    );
    antwoord.json({ items });
  }),
);

boekhoudRoutes.get(
  '/rapporten/ouderdomsanalyse',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({ soort: z.enum(['debiteuren', 'crediteuren']).default('debiteuren'), peildatum: datumSchema }),
      verzoek.query,
    );
    const uitkomst = await inContext(verzoek, (client, context) =>
      ouderdomsanalyse(client, context.administratieId, opdracht.soort, opdracht.peildatum),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/rapporten/btw',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const periode = valideer(periodeSchema, verzoek.query);
    const uitkomst = await inContext(verzoek, (client, context) =>
      btwOverzicht(client, context.administratieId, periode),
    );
    antwoord.json(uitkomst);
  }),
);

boekhoudRoutes.get(
  '/rapporten/icp',
  vereistRecht('rapport.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const periode = valideer(periodeSchema, verzoek.query);
    const uitkomst = await inContext(verzoek, (client, context) =>
      icpOverzicht(client, context.administratieId, periode),
    );
    antwoord.json(uitkomst);
  }),
);

// --- Audit -----------------------------------------------------------------

boekhoudRoutes.get(
  '/audit',
  vereistRecht('audit.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opties = valideer(
      z.object({
        limiet: z.coerce.number().int().min(1).max(200).default(50),
        voorId: z.string().max(30).optional(),
        onderwerpSoort: z.string().max(50).optional(),
        onderwerpId: z.string().max(80).optional(),
      }),
      verzoek.query,
    );
    const regels = await inContext(verzoek, (client) => leesAudit(client, opties));
    antwoord.json({ regels });
  }),
);

boekhoudRoutes.get(
  '/audit/controle',
  vereistRecht('audit.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const uitkomst = await inContext(verzoek, (client, context) =>
      controleerKetting(client, context.administratieId),
    );
    antwoord.json({
      ongeschonden: uitkomst === null,
      probleem: uitkomst,
      uitleg:
        uitkomst === null
          ? 'Elke regel in de audit trail verwijst correct naar de vorige. Er is niets achteraf gewijzigd.'
          : 'Er is een regel gevonden die niet klopt met de hash-ketting. Neem contact op met de beheerder.',
    });
  }),
);

// --- Dashboard -------------------------------------------------------------

boekhoudRoutes.get(
  '/dashboard',
  vereistRecht('administratie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({ vanaf: datumSchema.optional(), tot: datumSchema.optional() }),
      verzoek.query,
    );
    const vandaag = new Date().toISOString().slice(0, 10);
    const jaar = vandaag.slice(0, 4);
    const periode = { vanaf: opdracht.vanaf ?? `${jaar}-01-01`, tot: opdracht.tot ?? vandaag };

    const uitkomst = await inContext(verzoek, async (client, context) => {
      const administratie = await leesAdministratie(client, context.administratieId);
      const valuta = administratie.valuta;

      const wv = await winstEnVerlies(client, context.administratieId, periode);
      const bal = await balans(client, context.administratieId, periode.tot);
      const debiteuren = await ouderdomsanalyse(client, context.administratieId, 'debiteuren', periode.tot);
      const crediteuren = await ouderdomsanalyse(client, context.administratieId, 'crediteuren', periode.tot);

      const banksaldo = bal.activa
        .filter((regel) => regel.rubriek === 'Liquide middelen')
        .reduce((totaal, regel) => totaal.plus(Money.vanTekst(regel.saldo, valuta)), Money.nul(valuta));

      const btw = await btwOverzicht(client, context.administratieId, periode);
      const teBoeken = await zoekTransacties(client, context.administratieId, { status: 'nieuw', limiet: 200 });
      const bonnen = await ontbrekendeBonnen(client, context.administratieId, 10);
      const aandacht = await zoekFacturen(client, context.administratieId, { openstaand: true, limiet: 10 });

      return {
        periode,
        valuta,
        omzet: wv.totaalOpbrengsten,
        kosten: wv.totaalKosten,
        winst: wv.resultaat,
        banksaldo: banksaldo.toString(),
        openstaandeDebiteuren: debiteuren.totaal,
        openstaandeCrediteuren: crediteuren.totaal,
        verwachteBtw: btw.saldo,
        btwWaarschuwingen: btw.waarschuwingen.length,
        teBoekenTransacties: teBoeken.length,
        ontbrekendeBonnen: bonnen.length,
        facturenDieAandachtVragen: aandacht.items.map((factuur) => ({
          id: factuur.id,
          documentnummer: factuur.documentnummer,
          relatie: factuur.contact_naam,
          vervaldatum: factuur.vervaldatum,
          openstaand: Money.vanTekst(factuur.totaal_inclusief, factuur.valuta)
            .min(Money.vanTekst(factuur.betaald_bedrag, factuur.valuta))
            .toString(),
          status: factuur.status,
        })),
      };
    });

    antwoord.json(uitkomst);
  }),
);
