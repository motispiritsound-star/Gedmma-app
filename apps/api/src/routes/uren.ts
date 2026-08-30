/**
 * Routes voor projecten en urenregistratie.
 *
 * Twee dingen die je hier terugziet en die niet in een gewone CRUD-laag horen:
 *
 *  - Wie alleen `uren.lezen` heeft, ziet en wijzigt uitsluitend zijn eigen
 *    uren. Dat is geen schermkeuze maar een filter op de query, zodat het ook
 *    geldt als iemand de API rechtstreeks aanroept.
 *  - Factureren maakt een concept. Definitief maken en boeken blijft de weg via
 *    de verkoopmodule, met het recht dat daarbij hoort.
 */
import { Router } from 'express';
import { z, valideer, bedragSchema, datumSchema, uuidSchema } from '../http/valideer.ts';
import type { Verzoek } from '../http/context.ts';
import { administratieContext, eisAanmelding, vereistRecht } from '../http/middleware.ts';
import { asyncRoute, inContext, inContextIdempotent, verwachteVersie } from './hulp.ts';
import { eisSchrijfbaar, leesAdministratie } from '../modules/organisaties/service.ts';
import {
  activiteiten,
  leesProject,
  maakActiviteit,
  maakProject,
  wijzigProject,
  zoekProjecten,
} from '../modules/uren/projecten.ts';
import {
  beoordeel,
  dienIn,
  leesUur,
  projectoverzicht,
  schrijfUur,
  verwijderUur,
  wijzigUur,
  zoekUren,
} from '../modules/uren/service.ts';
import { factureerUren } from '../modules/uren/factureren.ts';

export const urenRoutes = Router({ mergeParams: true });

urenRoutes.use(eisAanmelding, administratieContext);

/** Weigert schrijfacties in een administratie die op alleen-lezen staat. */
async function eisSchrijven(verzoek: Verzoek): Promise<void> {
  await inContext(verzoek, async (client, context) => {
    eisSchrijfbaar(await leesAdministratie(client, context.administratieId));
  });
}

/** Mag deze gebruiker ook de uren van collega's zien en wijzigen? */
function magVoorAnderen(verzoek: Verzoek): boolean {
  return verzoek.werk?.rechten.has('uren.allen.lezen') ?? false;
}

// --- Projecten -------------------------------------------------------------

const projectSchema = z.object({
  naam: z.string().min(2, 'Geef het project een naam').max(200),
  code: z.string().max(40).nullish(),
  omschrijving: z.string().max(2000).nullish(),
  contactId: uuidSchema.nullish(),
  status: z.enum(['actief', 'op_pauze', 'afgerond', 'gearchiveerd']).optional(),
  facturatie: z.enum(['uurtarief', 'vaste_prijs', 'niet']).optional(),
  uurtarief: bedragSchema.nullish(),
  vastePrijs: bedragSchema.nullish(),
  budgetMinuten: z.number().int().min(0).max(10_000_000).nullish(),
  begintOp: datumSchema.nullish(),
  eindigtOp: datumSchema.nullish(),
  btwCodeId: uuidSchema.nullish(),
  rekeningId: uuidSchema.nullish(),
});

urenRoutes.get(
  '/projecten',
  vereistRecht('uren.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({
        zoek: z.string().max(100).optional(),
        status: z.enum(['actief', 'op_pauze', 'afgerond', 'gearchiveerd']).optional(),
        contactId: uuidSchema.optional(),
        limiet: z.coerce.number().int().min(1).max(200).default(100),
      }),
      verzoek.query,
    );
    const projecten = await inContext(verzoek, (client, context) =>
      zoekProjecten(client, context.administratieId, opdracht),
    );
    antwoord.json({ projecten });
  }),
);

urenRoutes.post(
  '/projecten',
  vereistRecht('project.beheren'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(projectSchema, verzoek.body);
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) =>
      maakProject(client, context, invoer),
    );
  }),
);

urenRoutes.get(
  '/projecten/:id',
  vereistRecht('uren.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const uitkomst = await inContext(verzoek, async (client, context) => ({
      project: await leesProject(client, context.administratieId, id),
      activiteiten: await activiteiten(client, context.administratieId, id),
    }));
    antwoord.json(uitkomst);
  }),
);

urenRoutes.patch(
  '/projecten/:id',
  vereistRecht('project.beheren'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(projectSchema, verzoek.body);
    const uitkomst = await inContext(verzoek, (client, context) =>
      wijzigProject(client, context, id, invoer, verwachteVersie(verzoek)),
    );
    antwoord.json(uitkomst);
  }),
);

urenRoutes.post(
  '/projecten/:id/activiteiten',
  vereistRecht('project.beheren'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(
      z.object({
        naam: z.string().min(1, 'Geef de activiteit een naam').max(120),
        uurtarief: bedragSchema.nullish(),
        factureerbaar: z.boolean().optional(),
      }),
      verzoek.body,
    );
    const uitkomst = await inContext(verzoek, (client, context) =>
      maakActiviteit(client, context, id, invoer),
    );
    antwoord.status(201).json(uitkomst);
  }),
);

urenRoutes.get(
  '/projecten-overzicht',
  vereistRecht('uren.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({ vanaf: datumSchema.optional(), tot: datumSchema.optional() }),
      verzoek.query,
    );
    const projecten = await inContext(verzoek, (client, context) =>
      projectoverzicht(client, context.administratieId, opdracht),
    );
    antwoord.json({ projecten });
  }),
);

// --- Uren ------------------------------------------------------------------

const uurSchema = z.object({
  projectId: uuidSchema,
  activiteitId: uuidSchema.nullish(),
  datum: datumSchema,
  minuten: z.number().int().min(1, 'Een uur duurt minstens een minuut').max(1440),
  omschrijving: z.string().min(2, 'Beschrijf kort wat je hebt gedaan').max(500),
  factureerbaar: z.boolean().optional(),
  uurtarief: bedragSchema.nullish(),
  gebruikerId: uuidSchema.nullish(),
});

urenRoutes.get(
  '/uren',
  vereistRecht('uren.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const opdracht = valideer(
      z.object({
        projectId: uuidSchema.optional(),
        gebruikerId: uuidSchema.optional(),
        status: z.enum(['concept', 'ingediend', 'goedgekeurd', 'afgekeurd', 'gefactureerd']).optional(),
        vanaf: datumSchema.optional(),
        tot: datumSchema.optional(),
        factureerbaar: z.coerce.boolean().optional(),
        alleenOngefactureerd: z.coerce.boolean().optional(),
        limiet: z.coerce.number().int().min(1).max(500).default(200),
      }),
      verzoek.query,
    );

    // Zonder het recht om alle uren te zien, blijft het bij de eigen uren.
    const beperkt = magVoorAnderen(verzoek)
      ? opdracht
      : { ...opdracht, gebruikerId: verzoek.aangemeld?.gebruikerId };

    const uitkomst = await inContext(verzoek, (client, context) =>
      zoekUren(client, context.administratieId, beperkt),
    );
    antwoord.json({ ...uitkomst, alleenEigenUren: !magVoorAnderen(verzoek) });
  }),
);

urenRoutes.post(
  '/uren',
  vereistRecht('uren.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(uurSchema, verzoek.body);
    const magAnderen = magVoorAnderen(verzoek);
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) =>
      schrijfUur(client, context, invoer, { magVoorAnderen: magAnderen }),
    );
  }),
);

urenRoutes.get(
  '/uren/:id',
  vereistRecht('uren.lezen'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const id = valideer(uuidSchema, verzoek.params.id);
    const uur = await inContext(verzoek, (client, context) => leesUur(client, context.administratieId, id));
    if (uur.user_id !== verzoek.aangemeld?.gebruikerId && !magVoorAnderen(verzoek)) {
      // Niet "verboden" maar "bestaat niet": zo verraadt het antwoord niet
      // dat er uren van een collega achter dit id zitten.
      antwoord.status(404).json({
        error: {
          code: 'not_found',
          message: 'Dit uur bestaat niet (meer).',
          hint: 'Je ziet alleen je eigen uren.',
        },
      });
      return;
    }
    antwoord.json({ uur });
  }),
);

urenRoutes.put(
  '/uren/:id',
  vereistRecht('uren.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const invoer = valideer(uurSchema, verzoek.body);
    const magAnderen = magVoorAnderen(verzoek);
    const uitkomst = await inContext(verzoek, (client, context) =>
      wijzigUur(client, context, id, invoer, {
        magVoorAnderen: magAnderen,
        verwachteVersie: verwachteVersie(verzoek),
      }),
    );
    antwoord.json(uitkomst);
  }),
);

urenRoutes.delete(
  '/uren/:id',
  vereistRecht('uren.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const id = valideer(uuidSchema, verzoek.params.id);
    const magAnderen = magVoorAnderen(verzoek);
    await inContext(verzoek, (client, context) =>
      verwijderUur(client, context, id, { magVoorAnderen: magAnderen }),
    );
    antwoord.status(204).end();
  }),
);

const idsSchema = z.object({ ids: z.array(uuidSchema).min(1, 'Kies minstens een uur').max(500) });

urenRoutes.post(
  '/uren/indienen',
  vereistRecht('uren.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const { ids } = valideer(idsSchema, verzoek.body);
    const magAnderen = magVoorAnderen(verzoek);
    const uitkomst = await inContext(verzoek, (client, context) =>
      dienIn(client, context, ids, { magVoorAnderen: magAnderen }),
    );
    antwoord.json(uitkomst);
  }),
);

urenRoutes.post(
  '/uren/beoordelen',
  vereistRecht('uren.goedkeuren'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(
      idsSchema.extend({
        goedgekeurd: z.boolean(),
        reden: z.string().max(500).nullish(),
      }),
      verzoek.body,
    );
    const uitkomst = await inContext(verzoek, (client, context) =>
      beoordeel(client, context, invoer.ids, { goedgekeurd: invoer.goedgekeurd, reden: invoer.reden }),
    );
    antwoord.json(uitkomst);
  }),
);

urenRoutes.post(
  '/uren/factureren',
  vereistRecht('verkoop.schrijven'),
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    await eisSchrijven(verzoek);
    const invoer = valideer(
      z.object({
        projectId: uuidSchema,
        uurIds: z.array(uuidSchema).max(1000).optional(),
        vanaf: datumSchema.nullish(),
        tot: datumSchema.nullish(),
        factuurdatum: datumSchema.optional(),
        alleenGoedgekeurd: z.boolean().optional(),
        btwCodeId: uuidSchema.nullish(),
        rekeningId: uuidSchema.nullish(),
        referentie: z.string().max(200).nullish(),
      }),
      verzoek.body,
    );
    await inContextIdempotent(verzoek, antwoord, 201, (client, context) =>
      factureerUren(client, context, invoer),
    );
  }),
);
