/** Routes voor organisaties, administraties, rekeningschema en perioden. */
import { Router } from 'express';
import { inTransactie } from '../db/pool.ts';
import { z, valideer, datumSchema, uuidSchema } from '../http/valideer.ts';
import { eisAangemeld, tenantVan, type Verzoek } from '../http/context.ts';
import { administratieContext, eisAanmelding, vereistRecht } from '../http/middleware.ts';
import { fout } from '../http/fout.ts';
import {
  leesAdministratie,
  maakAdministratie,
  maakOrganisatie,
  organisatiesVan,
  toegangVan,
} from '../modules/organisaties/service.ts';
import { alleBoekjaren, alleBtwCodes, alleDagboeken, allePeriodes, alleRekeningen } from '../modules/grootboek/repo.ts';
import { wijzigPeriodestatus } from '../modules/grootboek/service.ts';
import { STANDAARD_BTWCODES } from '../modules/btw/codes.ts';
import { SCHEMA_SJABLONEN } from '@gedmma/accounting';
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

    const uitkomst = await inContext(verzoek, async (client, context) => {
      await client.query(
        `UPDATE administration SET
           naam = COALESCE($2, naam),
           kvk_nummer = COALESCE($3, kvk_nummer),
           btw_nummer = COALESCE($4, btw_nummer),
           adres = COALESCE($5, adres),
           postcode_plaats = COALESCE($6, postcode_plaats),
           email = COALESCE($7, email),
           telefoon = COALESCE($8, telefoon),
           iban = COALESCE($9, iban),
           factuur_voettekst = COALESCE($10, factuur_voettekst),
           huisstijl_kleur = COALESCE($11, huisstijl_kleur),
           locale = COALESCE($12, locale),
           betalingsverschil_tolerantie = COALESCE($13::numeric, betalingsverschil_tolerantie),
           gewijzigd_op = now()
         WHERE id = $1`,
        [
          context.administratieId,
          invoer.naam ?? null,
          invoer.kvkNummer ?? null,
          invoer.btwNummer ?? null,
          invoer.adres ?? null,
          invoer.postcodePlaats ?? null,
          invoer.email ?? null,
          invoer.telefoon ?? null,
          invoer.iban ?? null,
          invoer.factuurVoettekst ?? null,
          invoer.huisstijlKleur ?? null,
          invoer.locale ?? null,
          invoer.betalingsverschilTolerantie?.replace(',', '.') ?? null,
        ],
      );
      return leesAdministratie(client, context.administratieId);
    });

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
