/**
 * De OpenAPI-beschrijving van de API.
 *
 * De lijst met paden komt niet uit een apart document maar uit de routers zelf:
 * dezelfde `koppelingen`-tabel die `server.ts` gebruikt om de routers te
 * monteren, wordt hier doorlopen. Een route die wordt toegevoegd, staat dus
 * meteen in de specificatie, en een route die verdwijnt, verdwijnt ook hier.
 *
 * Wat niet automatisch kan, is betekenis. Daarom staat per route een korte
 * omschrijving in `omschrijvingen`. Een contracttest bewaakt dat die tabel en
 * de routers precies gelijk lopen: geen route zonder omschrijving, geen
 * omschrijving zonder route.
 */
import type { Router } from "express";

export type Koppeling = { basis: string; router: Router };

type Handler = { name?: string; gedmmaRecht?: string };

type Laag = {
  handle?: Handler;
  route?: {
    path: string | string[];
    methods: Record<string, boolean>;
    stack: { handle: Handler }[];
  };
};

export type Eindpunt = {
  methode: string;
  pad: string;
  recht: string | null;
  aanmeldingVereist: boolean;
};

/** Zet `:id` om naar de OpenAPI-schrijfwijze `{id}`. */
function naarSjabloon(pad: string): string {
  return pad.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function padParameters(
  pad: string,
): { name: string; in: "path"; required: true; schema: { type: "string" } }[] {
  return [...pad.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((treffer) => ({
    name: treffer[1] ?? "",
    in: "path" as const,
    required: true as const,
    schema: { type: "string" as const },
  }));
}

/** Leest alle routes uit de gemonteerde routers, in de volgorde van montage. */
export function inventariseer(koppelingen: Koppeling[]): Eindpunt[] {
  const eindpunten: Eindpunt[] = [];

  for (const { basis, router } of koppelingen) {
    const lagen = (router as unknown as { stack: Laag[] }).stack ?? [];

    // `router.use(eisAanmelding)` geldt voor de hele router; per route kan het
    // ook nog eens los staan. Beide tellen mee.
    const routerEistAanmelding = lagen.some(
      (laag) => !laag.route && laag.handle?.name === "eisAanmelding",
    );

    for (const laag of lagen) {
      if (!laag.route) continue;
      const paden = Array.isArray(laag.route.path)
        ? laag.route.path
        : [laag.route.path];
      const recht =
        laag.route.stack
          .map((stap) => stap.handle?.gedmmaRecht)
          .find((waarde) => waarde) ?? null;
      const aanmeldingVereist =
        routerEistAanmelding ||
        recht !== null ||
        laag.route.stack.some((stap) => stap.handle?.name === "eisAanmelding");

      for (const pad of paden) {
        for (const [methode, actief] of Object.entries(laag.route.methods)) {
          if (!actief || methode === "_all") continue;
          eindpunten.push({
            methode: methode.toUpperCase(),
            pad: naarSjabloon(`${basis}${pad === "/" ? "" : pad}`),
            recht,
            aanmeldingVereist,
          });
        }
      }
    }
  }

  return eindpunten;
}

export function sleutelVan(eindpunt: Eindpunt): string {
  return `${eindpunt.methode} ${eindpunt.pad}`;
}

/**
 * Korte omschrijving per route, in gewone taal.
 *
 * De sleutel is `METHODE pad`. Zie de contracttest in `test/openapi.test.ts`.
 */
export const omschrijvingen: Record<string, string> = {
  // --- Aanmelden en account ------------------------------------------------
  "POST /api/v1/auth/register":
    "Maakt een account met een eerste organisatie en administratie aan.",
  "POST /api/v1/auth/login":
    "Meldt aan met e-mailadres en wachtwoord; vraagt zo nodig om de tweede stap.",
  "POST /api/v1/auth/mfa/verify":
    "Rondt het aanmelden af met een code uit de authenticator of een herstelcode.",
  "POST /api/v1/auth/mfa/setup":
    "Begint het instellen van tweestapsverificatie en levert het geheim.",
  "POST /api/v1/auth/mfa/confirm":
    "Bevestigt tweestapsverificatie met een code en levert de herstelcodes.",
  "POST /api/v1/auth/mfa/disable":
    "Zet tweestapsverificatie uit na een wachtwoordcontrole.",
  "POST /api/v1/auth/password":
    "Wijzigt het wachtwoord van de aangemelde gebruiker.",
  "POST /api/v1/auth/logout": "Trekt de huidige sessie in.",
  "POST /api/v1/auth/invitations/accept":
    "Aanvaardt een uitnodiging met de token uit het bericht.",
  "GET /api/v1/auth/me":
    "Geeft de aangemelde gebruiker met zijn organisaties, administraties en rechten.",
  "GET /api/v1/auth/sessions":
    "Toont de actieve sessies van de gebruiker, met de huidige gemarkeerd.",
  "DELETE /api/v1/auth/sessions":
    "Meldt alle andere apparaten af; de huidige sessie blijft.",

  // --- Organisaties ---------------------------------------------------------
  "GET /api/v1/organisaties":
    "Geeft de organisaties en administraties waar de gebruiker toegang toe heeft.",
  "POST /api/v1/organisaties": "Maakt een nieuwe organisatie aan.",
  "GET /api/v1/organisaties/sjablonen":
    "Geeft de beschikbare rekeningschema-sjablonen per rechtsvorm.",
  "POST /api/v1/organisaties/{organisatieId}/administraties":
    "Maakt een administratie aan met een rekeningschema, btw-codes en dagboeken.",
  "GET /api/v1/organisaties/{organisatieId}/leden":
    "Toont de leden van de organisatie met hun rol.",
  "POST /api/v1/organisaties/{organisatieId}/leden":
    "Nodigt iemand uit voor een rol binnen de organisatie.",
  "PATCH /api/v1/organisaties/{organisatieId}/leden/{membershipId}":
    "Wijzigt de rol van een lid; lopende sessies worden ingetrokken.",
  "DELETE /api/v1/organisaties/{organisatieId}/leden/{membershipId}":
    "Beëindigt de toegang van een lid.",

  // --- Administratie --------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}":
    "Geeft de administratie met haar instellingen en status.",
  "PATCH /api/v1/administraties/{administratieId}":
    "Wijzigt de instellingen van de administratie.",
  "GET /api/v1/administraties/{administratieId}/rekeningen":
    "Geeft het rekeningschema.",
  "GET /api/v1/administraties/{administratieId}/btwcodes":
    "Geeft de btw-codes met hun geldigheidsperiode.",
  "GET /api/v1/administraties/{administratieId}/dagboeken":
    "Geeft de dagboeken.",
  "GET /api/v1/administraties/{administratieId}/boekjaren":
    "Geeft de boekjaren met hun perioden en periodestatus.",
  "POST /api/v1/administraties/{administratieId}/perioden/{periodeId}/status":
    "Opent of sluit een boekperiode; in een gesloten periode kan niet worden geboekt.",
  "GET /api/v1/administraties/{administratieId}/dashboard":
    "Geeft de kerncijfers voor het dashboard.",

  // --- Relaties -------------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/relaties":
    "Zoekt relaties, met paginering via een cursor.",
  "POST /api/v1/administraties/{administratieId}/relaties":
    "Maakt een relatie aan; waarschuwt bij een mogelijke dubbele.",
  "GET /api/v1/administraties/{administratieId}/relaties/{id}":
    "Geeft één relatie.",
  "PATCH /api/v1/administraties/{administratieId}/relaties/{id}":
    "Wijzigt een relatie; vereist de verwachte versie.",
  "GET /api/v1/administraties/{administratieId}/relaties/dubbelcheck":
    "Zoekt mogelijke dubbelen bij een naam, e-mailadres of nummer.",

  // --- Verkoop --------------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/verkoopfacturen":
    "Zoekt verkoopfacturen en offertes.",
  "POST /api/v1/administraties/{administratieId}/verkoopfacturen":
    "Maakt een concept-verkoopfactuur of offerte.",
  "GET /api/v1/administraties/{administratieId}/verkoopfacturen/{id}":
    "Geeft één verkoopfactuur met haar regels.",
  "PUT /api/v1/administraties/{administratieId}/verkoopfacturen/{id}":
    "Wijzigt een concept; een definitieve factuur wijzigt niet meer.",
  "POST /api/v1/administraties/{administratieId}/verkoopfacturen/{id}/definitief":
    "Controleert de factuurvereisten, kent het nummer toe en boekt de factuur.",
  "POST /api/v1/administraties/{administratieId}/verkoopfacturen/{id}/crediteer":
    "Maakt een creditnota met een tegenboeking.",
  "POST /api/v1/administraties/{administratieId}/verkoopfacturen/{id}/naar-factuur":
    "Zet een aanvaarde offerte om in een factuur.",
  "GET /api/v1/administraties/{administratieId}/verkoopfacturen/{id}/pdf":
    "Levert de factuur als PDF.",
  "GET /api/v1/administraties/{administratieId}/verkoopfacturen/{id}/ubl":
    "Levert de factuur als UBL 2.1 volgens het EN 16931-profiel.",
  "POST /api/v1/administraties/{administratieId}/verkoopfacturen/{id}/verstuur":
    "Verstuurt de factuur per e-mail met PDF en UBL als bijlage.",

  // --- Inkoop ---------------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/inkoopfacturen":
    "Zoekt inkoopfacturen en bonnen.",
  "POST /api/v1/administraties/{administratieId}/inkoopfacturen":
    "Legt een inkoopfactuur of bon vast, eventueel met verlegde btw.",
  "GET /api/v1/administraties/{administratieId}/inkoopfacturen/{id}":
    "Geeft één inkoopfactuur met haar regels.",
  "POST /api/v1/administraties/{administratieId}/inkoopfacturen/{id}/definitief":
    "Maakt de inkoopfactuur definitief en boekt hem.",
  "GET /api/v1/administraties/{administratieId}/ontbrekende-bonnen":
    "Toont uitgaven zonder onderliggend document.",

  // --- Documenten -----------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/documenten":
    "Zoekt bonnen en bijlagen.",
  "POST /api/v1/administraties/{administratieId}/documenten":
    "Uploadt een document; controleert type en grootte en herkent dubbelen.",
  "GET /api/v1/administraties/{administratieId}/documenten/{id}/inhoud":
    "Levert het oorspronkelijke bestand.",

  // --- Bank -----------------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/bankrekeningen":
    "Geeft de bankrekeningen met hun saldo.",
  "POST /api/v1/administraties/{administratieId}/bankrekeningen":
    "Voegt een bankrekening toe.",
  "POST /api/v1/administraties/{administratieId}/bankrekeningen/{id}/import":
    "Importeert een afschrift (CSV, MT940 of CAMT.053) en slaat dubbelen over.",
  "GET /api/v1/administraties/{administratieId}/banktransacties":
    "Zoekt banktransacties, te filteren op status.",
  "GET /api/v1/administraties/{administratieId}/banktransacties/{id}/voorstellen":
    "Geeft afletteringsvoorstellen met per voorstel de reden.",
  "POST /api/v1/administraties/{administratieId}/banktransacties/{id}/boek":
    "Boekt een banktransactie, eventueel met een betaalverschil binnen de tolerantie.",
  "GET /api/v1/administraties/{administratieId}/bankrekeningen/{id}/reconciliatie":
    "Vergelijkt het banksaldo met het grootboeksaldo.",

  // --- Grootboek ------------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/journaalposten/{id}":
    "Geeft één journaalpost met haar regels.",
  "POST /api/v1/administraties/{administratieId}/journaalposten/{id}/storneer":
    "Maakt een tegenboeking; een definitieve post wordt nooit gewijzigd.",

  // --- Rapportage -----------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/rapporten/balans":
    "Balans per datum.",
  "GET /api/v1/administraties/{administratieId}/rapporten/winst-en-verlies":
    "Winst-en-verliesrekening over een periode.",
  "GET /api/v1/administraties/{administratieId}/rapporten/saldibalans":
    "Saldibalans met debet- en credittotalen per rekening.",
  "GET /api/v1/administraties/{administratieId}/rapporten/grootboekkaart/{rekeningId}":
    "Grootboekkaart van één rekening, met een doorlopend saldo.",
  "GET /api/v1/administraties/{administratieId}/rapporten/journaal":
    "Alle journaalregels over een periode, met paginering.",
  "GET /api/v1/administraties/{administratieId}/rapporten/ouderdomsanalyse":
    "Ouderdomsanalyse van debiteuren of crediteuren.",
  "GET /api/v1/administraties/{administratieId}/rapporten/btw":
    "Btw-overzicht per aangiftevak over een periode.",
  "GET /api/v1/administraties/{administratieId}/rapporten/icp":
    "ICP-overzicht van intracommunautaire leveringen.",

  // --- Audit ----------------------------------------------------------------
  "GET /api/v1/administraties/{administratieId}/audit":
    "Geeft het auditspoor, nieuwste eerst.",
  "GET /api/v1/administraties/{administratieId}/audit/controle":
    "Controleert de hashketen van het auditspoor op onderbrekingen.",
};

const foutantwoord = {
  description:
    "Fout, met een machineleesbare `code` en een uitlegbare `message` en `hint`.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Fout" },
    },
  },
};

/** Bouwt het OpenAPI-document uit de gemonteerde routers. */
export function bouwOpenApi(
  koppelingen: Koppeling[],
  versie: string,
): Record<string, unknown> {
  const paden: Record<string, Record<string, unknown>> = {};

  for (const eindpunt of inventariseer(koppelingen)) {
    const sleutel = sleutelVan(eindpunt);
    const openbaar = !eindpunt.aanmeldingVereist;

    const pad = (paden[eindpunt.pad] ??= {
      parameters: padParameters(eindpunt.pad),
    });
    pad[eindpunt.methode.toLowerCase()] = {
      summary: omschrijvingen[sleutel] ?? "Nog niet beschreven.",
      tags: [eindpunt.pad.split("/")[3] ?? "overig"],
      ...(eindpunt.recht ? { "x-vereist-recht": eindpunt.recht } : {}),
      ...(openbaar ? { security: [] } : {}),
      parameters: [
        ...(["POST", "PUT", "PATCH"].includes(eindpunt.methode)
          ? [
              {
                name: "Idempotency-Key",
                in: "header",
                required: eindpunt.methode === "POST",
                schema: { type: "string" },
                description:
                  "Verplicht op aanmakende POST; herhaalt hetzelfde antwoord.",
              },
            ]
          : []),
        ...(["PUT", "PATCH"].includes(eindpunt.methode)
          ? [
              {
                name: "If-Match",
                in: "header",
                required: false,
                schema: { type: "string" },
                description:
                  "De verwachte versie van de bron; voorkomt overschrijven.",
              },
            ]
          : []),
        {
          name: "Accept-Language",
          in: "header",
          required: false,
          schema: { type: "string", default: "nl" },
          description: "Bepaalt de taal van `message` en `hint`.",
        },
      ],
      responses: {
        "200": { description: "Gelukt." },
        "400": foutantwoord,
        "401": foutantwoord,
        "403": foutantwoord,
        "404": foutantwoord,
        "409": foutantwoord,
        "422": foutantwoord,
        "429": foutantwoord,
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Gedmma API",
      version: versie,
      description:
        "REST-API van het boekhoudplatform Gedmma. Bedragen zijn altijd decimale tekst, " +
        "nooit een getal met een drijvende komma. Zie docs/api.md.",
    },
    servers: [
      { url: "/", description: "Dezelfde host als deze specificatie." },
    ],
    components: {
      securitySchemes: {
        sessie: {
          type: "apiKey",
          in: "cookie",
          name: "gedmma_sessie",
          description: "Sessiecookie, gezet door POST /api/v1/auth/aanmelden.",
        },
      },
      schemas: {
        Fout: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: {
              type: "string",
              description: "Stabiele foutcode, zie docs/api.md.",
            },
            message: {
              type: "string",
              description: "Uitleg in de taal van het verzoek.",
            },
            hint: { type: "string", description: "Wat de gebruiker kan doen." },
            velden: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Foutmelding per veld bij een validatiefout.",
            },
            requestId: { type: "string" },
          },
        },
      },
    },
    security: [{ sessie: [] }],
    paths: paden,
  };
}
