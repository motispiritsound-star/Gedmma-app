/** Kleine hulpmiddelen voor de routelaag. */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { CookieOptions } from 'express';
import { config } from '../config.ts';
import { inTransactie, type Db, type TenantContext } from '../db/pool.ts';
import { eisWerkcontext, tenantVan, type Verzoek } from '../http/context.ts';
import { bewaarAntwoord, reserveer, zoekEerderAntwoord } from '../http/idempotentie.ts';
import { ApiFout } from '../http/fout.ts';

/** Vangt fouten uit async handlers op en geeft ze aan de foutafhandeling door. */
export function asyncRoute(
  handler: (verzoek: Verzoek, antwoord: Response, volgende: NextFunction) => Promise<void>,
): RequestHandler {
  return (verzoek: Request, antwoord: Response, volgende: NextFunction) => {
    handler(verzoek as Verzoek, antwoord, volgende).catch(volgende);
  };
}

export function cookieOpties(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProductie,
    sameSite: 'lax',
    path: '/',
    maxAge: config.beveiliging.sessieDuurUren * 3600_000,
  };
}

/**
 * Voert werk uit binnen de tenantcontext van de request. Alles wat de database
 * raakt loopt hierlangs, zodat de row-level security-context altijd staat.
 */
export async function inContext<T>(
  verzoek: Verzoek,
  werk: (client: Db, context: TenantContext & { administratieId: string }) => Promise<T>,
): Promise<T> {
  const werkcontext = eisWerkcontext(verzoek);
  const context = { ...tenantVan(verzoek), administratieId: werkcontext.administratieId };
  return inTransactie(context, (client) => werk(client, context as TenantContext & { administratieId: string }));
}

/**
 * Zelfde als `inContext`, maar met idempotentie: hetzelfde verzoek twee keer
 * versturen levert een keer werk op en twee keer hetzelfde antwoord.
 */
export async function inContextIdempotent<T>(
  verzoek: Verzoek,
  antwoord: Response,
  statusCode: number,
  werk: (client: Db, context: TenantContext & { administratieId: string }) => Promise<T>,
): Promise<void> {
  const sleutel = verzoek.header('idempotency-key');
  const werkcontext = eisWerkcontext(verzoek);

  if (!sleutel) {
    const uitkomst = await inContext(verzoek, werk);
    antwoord.status(statusCode).json(uitkomst);
    return;
  }
  if (!/^[\w-]{8,128}$/.test(sleutel)) {
    throw new ApiFout(
      'validation_failed',
      'De Idempotency-Key heeft een ongeldige vorm.',
      'Gebruik 8 tot 128 tekens uit letters, cijfers, streepjes en liggende streepjes.',
    );
  }

  const context = { ...tenantVan(verzoek), administratieId: werkcontext.administratieId };

  const eerder = await inTransactie(context, (client) =>
    zoekEerderAntwoord(client, werkcontext.administratieId, sleutel, verzoek.body),
  );
  if (eerder) {
    antwoord.status(eerder.statusCode).json(eerder.antwoord);
    return;
  }

  const uitkomst = await inTransactie(context, async (client) => {
    await reserveer(client, werkcontext.administratieId, verzoek.aangemeld?.gebruikerId ?? null, sleutel, verzoek.body);
    return werk(client, context as TenantContext & { administratieId: string });
  });

  await inTransactie(context, (client) =>
    bewaarAntwoord(client, werkcontext.administratieId, sleutel, statusCode, uitkomst),
  );

  antwoord.status(statusCode).json(uitkomst);
}

/** Leest de If-Match-header als versienummer voor optimistic locking. */
export function verwachteVersie(verzoek: Verzoek): number | undefined {
  const kop = verzoek.header('if-match');
  if (!kop) return undefined;
  const nummer = Number(kop.replace(/"/g, ''));
  return Number.isInteger(nummer) ? nummer : undefined;
}
