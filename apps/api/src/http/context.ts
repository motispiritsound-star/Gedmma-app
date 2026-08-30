/**
 * De request-context: wie is er aangemeld, in welke organisatie en administratie
 * werkt hij, en welke rechten heeft hij daar. Alles wat een route nodig heeft om
 * te beslissen of iets mag.
 */
import type { Request } from 'express';
import type { TenantContext } from '../db/pool.ts';
import { fout } from './fout.ts';

export type Aangemeld = {
  gebruikerId: string;
  email: string;
  naam: string;
  locale: string;
  sessieId: string;
  mfaVoldaan: boolean;
  /** Bij impersonatie: de echte support-medewerker achter deze sessie. */
  supportGebruikerId: string | null;
};

export type Werkcontext = {
  organisatieId: string;
  administratieId: string | null;
  rechten: ReadonlySet<string>;
  rolSleutel: string;
};

export type Verzoek = Request & {
  requestId: string;
  aangemeld?: Aangemeld;
  werk?: Werkcontext;
};

/** De aangemelde gebruiker, of een nette 401. */
export function eisAangemeld(verzoek: Verzoek): Aangemeld {
  if (!verzoek.aangemeld) throw fout.nietAangemeld();
  return verzoek.aangemeld;
}

/** De actieve werkcontext, of een nette fout. */
export function eisWerkcontext(verzoek: Verzoek): Werkcontext & { administratieId: string } {
  const werk = verzoek.werk;
  if (!werk) throw fout.nietAangemeld();
  if (!werk.administratieId) {
    throw fout.nietGevonden('Er is geen administratie gekozen; deze handeling');
  }
  return werk as Werkcontext & { administratieId: string };
}

/** Controleert een recht en gooit anders een 403 met uitleg. */
export function eisRecht(verzoek: Verzoek, recht: string): void {
  if (!verzoek.werk?.rechten.has(recht)) throw fout.geenRecht(recht);
}

/** Bouwt de tenantcontext voor een databasetransactie. */
export function tenantVan(verzoek: Verzoek): TenantContext {
  return {
    organisatieId: verzoek.werk?.organisatieId ?? null,
    administratieId: verzoek.werk?.administratieId ?? null,
    gebruikerId: verzoek.aangemeld?.gebruikerId ?? null,
    actorSoort: verzoek.aangemeld?.supportGebruikerId ? 'support' : 'gebruiker',
    requestId: verzoek.requestId,
  };
}
