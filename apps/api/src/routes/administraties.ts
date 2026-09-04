/** Routes voor organisaties, administraties, rekeningschema en perioden. */
import { Router } from 'express';
import { inTransactie } from '../db/pool.ts';
import { z, valideer, datumSchema, uuidSchema } from '../http/valideer.ts';
import { eisAangemeld, type Verzoek } from '../http/context.ts';
import { administratieContext, eisAanmelding, vereistRecht } from '../http/middleware.ts';
import { fout } from '../http/fout.ts';
import {
  leesAdministratie,
  maakAdministratie,
  maakOrganisatie,
  organisatiesVan,
  wijzigAdministratie,
} from '../modules/organisaties/service.ts';
import { alleBoekjaren, alleBtwCodes, alleDagboeken, allePeriodes, alleRekeningen } from '../modules/grootboek/repo.ts';
import { wijzigPeriodestatus } from '../modules/grootboek/service.ts';
import { STANDAARD_BTWCODES } from '../modules/btw/codes.ts';
import { SCHEMA_SJABLONEN } from '@gedmma/accounting';
import { behandelFeedback, meldFeedback, zoekFeedback } from '../modules/feedback/service.ts';
import { ledenVan, nodigUit, trekToegangIn, wijzigRol } from '../modules/organisaties/leden.ts';
import { asyncRoute, inContext } from './hulp.ts';

export const organisatieRoutes = Router();

organisatieRoutes.use(eisAanmelding);

organisatieRoutes.get(
  '/',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    antwoord.json({ organisaties: await organisatiesVan(aangemeld.gebruikerId) });
  }),
);

organisatieRoutes.post(
  '/',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const invoer = valideer(
      z.object({
        naam: z.string().min(2).max(200),
        kvkNummer: z.string().max(20).nullish(),
        land: z.string().length(2).default('NL'),
        abonnement: z.enum(['starter', 'zzp', 'mkb', 'professional', 'accountant', 'enterprise']).default('zzp'),
      }),
      verzoek.body,
    );
    const uitkomst = await maakOrganisatie(aangemeld.gebruikerId, invoer);
    antwoord.status(201).json(uitkomst);
  }),
);

organisatieRoutes.post(
  '/:organisatieId/administraties',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    const invoer = valideer(
      z.object({
        naam: z.string().min(2).max(200),
        rechtsvorm: z.string().max(50).optional(),
        schemaSjabloon: z.enum(['zzp', 'bv', 'stichting', 'vereniging']).default('zzp'),
        valuta: z.string().length(3).default('EUR'),
        kvkNummer: z.string().max(20).nullish(),
        btwNummer: z.string().max(30).nullish(),
        adres: z.string().max(200).nullish(),
        postcodePlaats: z.string().max(200).nullish(),
        email: z.string().email().nullish(),
        telefoon: z.string().max(40).nullish(),
        iban: z.string().max(40).nullish(),
        boekjaarBegint: datumSchema.optional(),
        boekjaarEindigt: datumSchema.optional(),
      }),
      verzoek.body,
    );

    // Hoort de gebruiker wel bij deze organisatie?
    const organisaties = await organisatiesVan(aangemeld.gebruikerId);
    const lidmaatschap = organisaties.find((o) => o.organisatie.id === organisatieId);
    if (!lidmaatschap) throw fout.nietGevonden('Deze organisatie');
    if (!['owner', 'admin'].includes(lidmaatschap.rol)) throw fout.geenRecht('administratie.beheren');

    const uitkomst = await maakAdministratie(
      { organisatieId, administratieId: null, gebruikerId: aangemeld.gebruikerId, actorSoort: 'gebruiker' },
      invoer,
    );
    antwoord.status(201).json(uitkomst);
  }),
);

organisatieRoutes.get(
  '/sjablonen',
  asyncRoute(async (_verzoek: Verzoek, antwoord) => {
    antwoord.json({
      rekeningschemas: SCHEMA_SJABLONEN.map((sjabloon) => ({
        sleutel: sjabloon.sleutel,
        naam: sjabloon.naam,
        omschrijving: sjabloon.omschrijving,
        aantalRekeningen: sjabloon.rekeningen.length,
      })),
      btwcodes: STANDAARD_BTWCODES.map((code) => ({
        code: code.code,
        naam: code.naam,
        soort: code.soort,
        tarief: code.tarief,
        uitleg: code.uitleg,
      })),
    });
  }),
);

export const administratieRoutes = Router({ mergeParams: true });

administratieRoutes.use(eisAanmelding, administratieContext);

administratieRoutes.get(
  '/',
  vereistRecht('administratie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const administratie = await inContext(verzoek, (client, context) =>
      leesAdministratie(client, context.administratieId),
    );
    antwoord.json({
      administratie,
      rechten: [...(verzoek.werk?.rechten ?? [])],
      rol: verzoek.werk?.rolSleutel,
    });
  }),
);

administratieRoutes.patch(
  '/',
  vereistRecht('administratie.beheren'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const invoer = valideer(
      z.object({
        naam: z.string().min(2).max(200).optional(),
        kvkNummer: z.string().max(20).nullish(),
        btwNummer: z.string().max(30).nullish(),
        adres: z.string().max(200).nullish(),
        postcodePlaats: z.string().max(200).nullish(),
        email: z.string().email().nullish(),
        telefoon: z.string().max(40).nullish(),
        iban: z.string().max(40).nullish(),
        factuurVoettekst: z.string().max(500).nullish(),
        huisstijlKleur: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullish(),
        locale: z.enum(['nl', 'en', 'de', 'fr']).optional(),
        betalingsverschilTolerantie: z.string().regex(/^\d+([.,]\d{1,2})?$/).optional(),
      }),
      verzoek.body,
    );

    const uitkomst = await inContext(verzoek, (client, context) =>
      wijzigAdministratie(client, context, {
        naam: invoer.naam ?? null,
        kvkNummer: invoer.kvkNummer ?? null,
        btwNummer: invoer.btwNummer ?? null,
        adres: invoer.adres ?? null,
        postcodePlaats: invoer.postcodePlaats ?? null,
        email: invoer.email ?? null,
        telefoon: invoer.telefoon ?? null,
        iban: invoer.iban ?? null,
        factuurVoettekst: invoer.factuurVoettekst ?? null,
        huisstijlKleur: invoer.huisstijlKleur ?? null,
        locale: invoer.locale ?? null,
        betalingsverschilTolerantie: invoer.betalingsverschilTolerantie?.replace(',', '.') ?? null,
      }),
    );

    antwoord.json({ administratie: uitkomst });
  }),
);

administratieRoutes.get(
  '/rekeningen',
  vereistRecht('administratie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const rekeningen = await inContext(verzoek, (client, context) =>
      alleRekeningen(client, context.administratieId),
    );
    antwoord.json({ rekeningen });
  }),
);

administratieRoutes.get(
  '/btwcodes',
  vereistRecht('administratie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const codes = await inContext(verzoek, (client, context) => alleBtwCodes(client, context.administratieId));
    const uitleg = new Map(STANDAARD_BTWCODES.map((code) => [code.code, code.uitleg]));
    antwoord.json({
      btwcodes: codes.map((code) => ({ ...code, uitleg: uitleg.get(code.code) ?? null })),
    });
  }),
);

administratieRoutes.get(
  '/dagboeken',
  vereistRecht('administratie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const dagboeken = await inContext(verzoek, (client, context) =>
      alleDagboeken(client, context.administratieId),
    );
    antwoord.json({ dagboeken });
  }),
);

administratieRoutes.get(
  '/boekjaren',
  vereistRecht('administratie.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const uitkomst = await inContext(verzoek, async (client, context) => {
      const boekjaren = await alleBoekjaren(client, context.administratieId);
      const perioden = await allePeriodes(client, context.administratieId);
      return { boekjaren, perioden };
    });
    antwoord.json(uitkomst);
  }),
);

administratieRoutes.post(
  '/perioden/:periodeId/status',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const periodeId = valideer(uuidSchema, verzoek.params.periodeId);
    const invoer = valideer(
      z.object({
        status: z.enum(['open', 'geblokkeerd', 'gesloten']),
        reden: z.string().max(500).optional(),
      }),
      verzoek.body,
    );

    const benodigdRecht = invoer.status === 'open' ? 'periode.heropenen' : 'periode.sluiten';
    if (!verzoek.werk?.rechten.has(benodigdRecht)) throw fout.geenRecht(benodigdRecht);

    await inContext(verzoek, (client, context) =>
      wijzigPeriodestatus(client, context, periodeId, invoer.status, invoer.reden),
    );
    antwoord.json({ periodeId, status: invoer.status });
  }),
);

// --- Leden van een organisatie ---------------------------------------------

/** Controleert dat de gebruiker gebruikers mag beheren in deze organisatie. */
async function eisBeheerder(verzoek: Verzoek, organisatieId: string): Promise<void> {
  const aangemeld = eisAangemeld(verzoek);
  const organisaties = await organisatiesVan(aangemeld.gebruikerId);
  const lidmaatschap = organisaties.find((o) => o.organisatie.id === organisatieId);
  if (!lidmaatschap) throw fout.nietGevonden('Deze organisatie');
  if (!['owner', 'admin'].includes(lidmaatschap.rol)) throw fout.geenRecht('gebruiker.beheren');
}

organisatieRoutes.get(
  '/:organisatieId/leden',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    await eisBeheerder(verzoek, organisatieId);
    const aangemeld = eisAangemeld(verzoek);
    const leden = await inTransactie(
      { organisatieId, administratieId: null, gebruikerId: aangemeld.gebruikerId, actorSoort: 'gebruiker' },
      (client) => ledenVan(client, organisatieId),
    );
    antwoord.json({ leden });
  }),
);

organisatieRoutes.post(
  '/:organisatieId/leden',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    await eisBeheerder(verzoek, organisatieId);
    const aangemeld = eisAangemeld(verzoek);
    const invoer = valideer(
      z.object({
        email: z.string().email('Vul een geldig e-mailadres in'),
        rol: z.enum(['admin', 'bookkeeper', 'accountant', 'employee', 'viewer']),
        administratieIds: z.array(uuidSchema).max(200).optional(),
        geldigTot: z.string().datetime().nullish(),
      }),
      verzoek.body,
    );
    const uitkomst = await inTransactie(
      { organisatieId, administratieId: null, gebruikerId: aangemeld.gebruikerId, actorSoort: 'gebruiker' },
      (client) => nodigUit(client, { organisatieId, administratieId: null, gebruikerId: aangemeld.gebruikerId, actorSoort: 'gebruiker' }, invoer),
    );
    antwoord.status(201).json({
      membershipId: uitkomst.membershipId,
      melding: 'De uitnodiging is verstuurd. Hij verloopt over veertien dagen.',
    });
  }),
);

organisatieRoutes.patch(
  '/:organisatieId/leden/:membershipId',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    const membershipId = valideer(uuidSchema, verzoek.params.membershipId);
    await eisBeheerder(verzoek, organisatieId);
    const aangemeld = eisAangemeld(verzoek);
    const invoer = valideer(
      z.object({ rol: z.enum(['admin', 'bookkeeper', 'accountant', 'employee', 'viewer']) }),
      verzoek.body,
    );
    const context = { organisatieId, administratieId: null, gebruikerId: aangemeld.gebruikerId, actorSoort: 'gebruiker' as const };
    await inTransactie(context, (client) => wijzigRol(client, context, membershipId, invoer.rol));
    antwoord.json({ melding: 'De rol is gewijzigd. De gebruiker moet opnieuw aanmelden.' });
  }),
);

organisatieRoutes.delete(
  '/:organisatieId/leden/:membershipId',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    const membershipId = valideer(uuidSchema, verzoek.params.membershipId);
    await eisBeheerder(verzoek, organisatieId);
    const aangemeld = eisAangemeld(verzoek);
    const context = { organisatieId, administratieId: null, gebruikerId: aangemeld.gebruikerId, actorSoort: 'gebruiker' as const };
    await inTransactie(context, (client) => trekToegangIn(client, context, membershipId));
    antwoord.json({ melding: 'De toegang is ingetrokken.' });
  }),
);

// --- Feedback ---------------------------------------------------------------
// Iets opmerken mag iedereen die is aangemeld: ook een meekijker, ook iemand
// die alleen aan het proberen is. Het lezen en afhandelen ervan is voorbehouden
// aan wie de organisatie beheert.

/** Controleert dat de gebruiker lid is van deze organisatie. */
async function eisLid(verzoek: Verzoek, organisatieId: string): Promise<void> {
  const aangemeld = eisAangemeld(verzoek);
  const organisaties = await organisatiesVan(aangemeld.gebruikerId);
  if (!organisaties.some((o) => o.organisatie.id === organisatieId)) {
    throw fout.nietGevonden('Deze organisatie');
  }
}

organisatieRoutes.post(
  '/:organisatieId/feedback',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    await eisLid(verzoek, organisatieId);
    const aangemeld = eisAangemeld(verzoek);

    const invoer = valideer(
      z.object({
        soort: z.enum(['opmerking', 'fout', 'wens', 'vraag']).optional(),
        bericht: z.string().min(3, 'Schrijf kort op wat je opvalt').max(5000),
        naam: z.string().max(120).nullish(),
        scherm: z.string().max(200).nullish(),
        versieApp: z.string().max(60).nullish(),
        administratieId: uuidSchema.nullish(),
      }),
      verzoek.body,
    );

    const context = {
      organisatieId,
      administratieId: invoer.administratieId ?? null,
      gebruikerId: aangemeld.gebruikerId,
      actorSoort: 'gebruiker' as const,
    };
    const uitkomst = await inTransactie(context, (client) => meldFeedback(client, context, invoer));

    antwoord.status(201).json({
      id: uitkomst.id,
      melding: 'Dank je wel. Je opmerking staat genoteerd.',
    });
  }),
);

organisatieRoutes.get(
  '/:organisatieId/feedback',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    await eisBeheerder(verzoek, organisatieId);
    const aangemeld = eisAangemeld(verzoek);

    const opdracht = valideer(
      z.object({
        status: z.enum(['nieuw', 'opgepakt', 'verwerkt', 'afgewezen']).optional(),
        limiet: z.coerce.number().int().min(1).max(500).default(100),
      }),
      verzoek.query,
    );

    const uitkomst = await inTransactie(
      { organisatieId, administratieId: null, gebruikerId: aangemeld.gebruikerId, actorSoort: 'gebruiker' },
      (client) => zoekFeedback(client, organisatieId, opdracht),
    );
    antwoord.json(uitkomst);
  }),
);

organisatieRoutes.patch(
  '/:organisatieId/feedback/:feedbackId',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const organisatieId = valideer(uuidSchema, verzoek.params.organisatieId);
    const feedbackId = valideer(uuidSchema, verzoek.params.feedbackId);
    await eisBeheerder(verzoek, organisatieId);
    const aangemeld = eisAangemeld(verzoek);

    const invoer = valideer(
      z.object({
        status: z.enum(['nieuw', 'opgepakt', 'verwerkt', 'afgewezen']),
        antwoord: z.string().max(2000).nullish(),
      }),
      verzoek.body,
    );

    const context = {
      organisatieId,
      administratieId: null,
      gebruikerId: aangemeld.gebruikerId,
      actorSoort: 'gebruiker' as const,
    };
    const uitkomst = await inTransactie(context, (client) =>
      behandelFeedback(client, context, feedbackId, invoer),
    );
    antwoord.json(uitkomst);
  }),
);
