/**
 * Middleware: request-id, beveiligingsheaders, aanmelding en tenantcontext.
 * Elke laag doet één ding en laat de volgende beslissen.
 */
import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import { config } from "../config.ts";
import { log } from "../util/log.ts";
import { leesSessie } from "../auth/service.ts";
import { toegangVan } from "../modules/organisaties/service.ts";
import { ApiFout, fout, vanBoekhoudFout, vanDatabaseFout } from "./fout.ts";
import type { Verzoek } from "./context.ts";
import { BoekhoudFout } from "@gedmma/accounting";

export const SESSIE_COOKIE = "gedmma_sessie";

/** Geeft elke request een id dat in logs, audit en foutantwoorden terugkomt. */
export function requestId(
  verzoek: Verzoek,
  antwoord: Response,
  volgende: NextFunction,
): void {
  const meegegeven = verzoek.header("x-request-id");
  verzoek.requestId =
    meegegeven && /^[\w-]{1,64}$/.test(meegegeven) ? meegegeven : randomUUID();
  antwoord.setHeader("X-Request-Id", verzoek.requestId);
  volgende();
}

/** De beveiligingsheaders uit docs/security.md. */
export function beveiligingsheaders(
  _verzoek: Verzoek,
  antwoord: Response,
  volgende: NextFunction,
): void {
  antwoord.setHeader("X-Content-Type-Options", "nosniff");
  antwoord.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  antwoord.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  antwoord.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  antwoord.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  antwoord.setHeader("X-Frame-Options", "DENY");
  // De API levert geen HTML; een strakke CSP voorkomt dat een foutpagina toch
  // iets uitvoert.
  antwoord.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  if (config.isProductie) {
    antwoord.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  volgende();
}

/**
 * CORS voor de webapp. Bewust een allowlist met een enkele oorsprong in plaats
 * van een wildcard, want de API werkt met cookies.
 */
export function cors(
  verzoek: Verzoek,
  antwoord: Response,
  volgende: NextFunction,
): void {
  const oorsprong = verzoek.header("origin");
  const toegestaan = new Set([
    config.webUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  if (oorsprong && toegestaan.has(oorsprong)) {
    antwoord.setHeader("Access-Control-Allow-Origin", oorsprong);
    antwoord.setHeader("Access-Control-Allow-Credentials", "true");
    antwoord.setHeader("Vary", "Origin");
    antwoord.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Idempotency-Key, If-Match, X-Request-Id, Accept-Language",
    );
    antwoord.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    );
    antwoord.setHeader("Access-Control-Max-Age", "600");
  }
  if (verzoek.method === "OPTIONS") {
    antwoord.status(204).end();
    return;
  }
  volgende();
}

/**
 * CSRF-bescherming: bij een onveilige methode moet de Origin (of Referer) van
 * een toegestane herkomst komen. Samen met SameSite=Lax op het cookie is dat
 * afdoende zonder losse tokens.
 */
export function controleerOorsprong(
  verzoek: Verzoek,
  _antwoord: Response,
  volgende: NextFunction,
): void {
  if (["GET", "HEAD", "OPTIONS"].includes(verzoek.method)) {
    volgende();
    return;
  }
  // Verzoeken met een bearer-token dragen geen cookie en zijn dus niet vatbaar
  // voor CSRF.
  if (verzoek.header("authorization")) {
    volgende();
    return;
  }
  const oorsprong = verzoek.header("origin") ?? verzoek.header("referer");
  if (!oorsprong) {
    volgende();
    return;
  }
  const toegestaan = [
    config.webUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  if (!toegestaan.some((herkomst) => oorsprong.startsWith(herkomst))) {
    volgende(
      new ApiFout(
        "forbidden",
        "Dit verzoek komt van een onbekende website.",
        "Open de applicatie opnieuw via het juiste adres.",
      ),
    );
    return;
  }
  volgende();
}

/** Leest de sessie uit het cookie of de Authorization-header. */
export async function aanmelding(
  verzoek: Verzoek,
  _antwoord: Response,
  volgende: NextFunction,
): Promise<void> {
  try {
    const bearer = verzoek.header("authorization");
    const uitCookie = leesCookie(verzoek.header("cookie"), SESSIE_COOKIE);
    const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : uitCookie;
    if (token) {
      const sessie = await leesSessie(token);
      if (sessie) {
        verzoek.aangemeld = {
          gebruikerId: sessie.gebruikerId,
          email: sessie.email,
          naam: sessie.naam,
          locale: sessie.locale,
          sessieId: sessie.sessieId,
          mfaVoldaan: sessie.mfaVoldaan,
          supportGebruikerId: sessie.supportGebruikerId,
        };
      }
    }
    volgende();
  } catch (foutje) {
    volgende(foutje);
  }
}

export function leesCookie(
  kop: string | undefined,
  naam: string,
): string | undefined {
  if (!kop) return undefined;
  for (const deel of kop.split(";")) {
    const [sleutel, ...rest] = deel.trim().split("=");
    if (sleutel === naam) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** Eist een aangemelde gebruiker die ook de tweede stap heeft gezet. */
export function eisAanmelding(
  verzoek: Verzoek,
  _antwoord: Response,
  volgende: NextFunction,
): void {
  if (!verzoek.aangemeld) {
    volgende(fout.nietAangemeld());
    return;
  }
  if (!verzoek.aangemeld.mfaVoldaan) {
    volgende(fout.mfaNodig());
    return;
  }
  volgende();
}

/**
 * Zet de werkcontext op basis van de administratie in het pad. Hoort de
 * gebruiker er niet bij, dan is het antwoord 404 en niet 403: het bestaan van
 * een administratie van een andere tenant mag niet afleidbaar zijn.
 */
export async function administratieContext(
  verzoek: Verzoek,
  _antwoord: Response,
  volgende: NextFunction,
): Promise<void> {
  try {
    const administratieId = verzoek.params.administratieId;
    if (!administratieId) {
      volgende(fout.nietGevonden("Deze administratie"));
      return;
    }
    const aangemeld = verzoek.aangemeld;
    if (!aangemeld) {
      volgende(fout.nietAangemeld());
      return;
    }
    const toegang = await toegangVan(aangemeld.gebruikerId, administratieId);
    if (!toegang) {
      volgende(fout.nietGevonden("Deze administratie"));
      return;
    }
    verzoek.werk = {
      organisatieId: toegang.organisatieId,
      administratieId,
      rechten: toegang.rechten,
      rolSleutel: toegang.rolSleutel,
    };
    volgende();
  } catch (foutje) {
    volgende(foutje);
  }
}

/**
 * Middleware die een recht afdwingt.
 *
 * De teruggegeven functie draagt het recht als eigenschap mee. Daardoor kan de
 * OpenAPI-generator uit de routertabel aflezen welk recht een route vraagt,
 * zonder dat die lijst ergens apart moet worden bijgehouden.
 */
export function vereistRecht(recht: string): RechtMiddleware {
  const middleware = (
    verzoek: Verzoek,
    _antwoord: Response,
    volgende: NextFunction,
  ): void => {
    if (!verzoek.werk?.rechten.has(recht)) {
      volgende(fout.geenRecht(recht));
      return;
    }
    volgende();
  };
  middleware.gedmmaRecht = recht;
  return middleware;
}

export type RechtMiddleware = {
  (verzoek: Verzoek, antwoord: Response, volgende: NextFunction): void;
  gedmmaRecht: string;
};

/** Logt elke request met duur en uitkomst. Zonder persoonsgegevens. */
export function toegangslog(
  verzoek: Verzoek,
  antwoord: Response,
  volgende: NextFunction,
): void {
  const begin = process.hrtime.bigint();
  antwoord.on("finish", () => {
    const duurMs = Number(process.hrtime.bigint() - begin) / 1e6;
    log.info("http", {
      methode: verzoek.method,
      pad: verzoek.route?.path ?? verzoek.path,
      status: antwoord.statusCode,
      duurMs: Math.round(duurMs),
      requestId: verzoek.requestId,
      gebruiker: verzoek.aangemeld?.gebruikerId ?? null,
      administratie: verzoek.werk?.administratieId ?? null,
    });
  });
  volgende();
}

/** De laatste laag: vertaalt elke fout naar een net antwoord. */
export function foutafhandeling(
  foutje: unknown,
  verzoek: Verzoek,
  antwoord: Response,
  _volgende: NextFunction,
): void {
  let api: ApiFout;

  if (foutje instanceof ApiFout) {
    api = foutje;
  } else if (foutje instanceof BoekhoudFout) {
    api = vanBoekhoudFout(foutje);
  } else {
    const uitDatabase = vanDatabaseFout(foutje);
    if (uitDatabase) {
      api = uitDatabase;
    } else {
      api = new ApiFout(
        "internal_error",
        "Er is iets misgegaan aan onze kant.",
        "Probeer het opnieuw. Blijft het misgaan, geef dan het onderstaande kenmerk door aan de ondersteuning.",
      );
      log.error("Onverwachte fout", {
        requestId: verzoek.requestId,
        pad: verzoek.path,
        fout: foutje instanceof Error ? foutje.message : String(foutje),
        stack:
          foutje instanceof Error
            ? foutje.stack?.split("\n").slice(0, 6).join("\n")
            : undefined,
      });
    }
  }

  if (api.status >= 500) {
    log.error("Serverfout", {
      requestId: verzoek.requestId,
      code: api.code,
      melding: api.message,
    });
  }

  antwoord.status(api.status).json({
    error: {
      code: api.code,
      message: api.message,
      hint: api.hint,
      details: api.details,
      requestId: verzoek.requestId,
    },
  });
}
