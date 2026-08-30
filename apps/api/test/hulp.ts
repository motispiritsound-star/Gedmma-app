/**
 * Testopzet.
 *
 * De tests draaien tegen een echte PostgreSQL en een echte HTTP-server; er
 * wordt niets gemockt. Dat is overgenomen uit de aanpak die al in dit
 * repository stond (fixtureserver in plaats van mocks) en is voor financiele
 * software het enige dat iets bewijst.
 */
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgres://gedmma_app:gedmma_dev@127.0.0.1:5432/gedmma_test';
process.env.DATABASE_MIGRATION_URL ??= 'postgres://gedmma_owner:gedmma_dev@127.0.0.1:5432/gedmma_test';
process.env.DATABASE_APP_ROLE ??= 'gedmma_app';
process.env.PASSWORD_PEPPER ??= 'test-peper';
process.env.DATA_ENCRYPTION_KEY ??= '1'.repeat(64);
process.env.LOG_LEVEL ??= 'error';
process.env.MAIL_DRIVER ??= 'logboek';
// scrypt met productieparameters maakt de testsuite onnodig traag; de
// correctheid van de hashfunctie wordt apart getest.
process.env.SCRYPT_COST ??= '16384';

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { leegDatabase, migreer } from '../src/db/migreer.ts';
import { seedBasisgegevens } from '../src/db/seed.ts';
import { maakApp } from '../src/http/server.ts';
import { db, inTransactie, SYSTEEM_CONTEXT, type Db } from '../src/db/pool.ts';
import { gebruikGeheugenopslag } from '../src/opslag/index.ts';

export type Antwoord<T = any> = {
  status: number;
  body: T;
  headers: Headers;
};

export class Client {
  #basis: string;
  #token: string | null = null;

  constructor(basis: string) {
    this.#basis = basis;
  }

  get token(): string | null {
    return this.#token;
  }

  zetToken(token: string | null): void {
    this.#token = token;
  }

  async verzoek<T = any>(
    methode: string,
    pad: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<Antwoord<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders };
    if (this.#token) headers.Authorization = `Bearer ${this.#token}`;

    const antwoord = await fetch(`${this.#basis}${pad}`, {
      method: methode,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const tekst = await antwoord.text();
    let inhoud: unknown = null;
    if (tekst) {
      try {
        inhoud = JSON.parse(tekst);
      } catch {
        inhoud = tekst;
      }
    }
    return { status: antwoord.status, body: inhoud as T, headers: antwoord.headers };
  }

  get<T = any>(pad: string, headers?: Record<string, string>) {
    return this.verzoek<T>('GET', pad, undefined, headers);
  }
  post<T = any>(pad: string, body?: unknown, headers?: Record<string, string>) {
    return this.verzoek<T>('POST', pad, body, headers);
  }
  put<T = any>(pad: string, body?: unknown, headers?: Record<string, string>) {
    return this.verzoek<T>('PUT', pad, body, headers);
  }
  patch<T = any>(pad: string, body?: unknown, headers?: Record<string, string>) {
    return this.verzoek<T>('PATCH', pad, body, headers);
  }
  delete<T = any>(pad: string, headers?: Record<string, string>) {
    return this.verzoek<T>('DELETE', pad, undefined, headers);
  }
}

let server: Server | null = null;
let basisUrl = '';

/** Zet een verse database op en start de API. Eenmalig per testbestand. */
export async function startTestomgeving(): Promise<{ client: Client; basis: string }> {
  gebruikGeheugenopslag();
  await leegDatabase();
  await migreer({ stil: true });
  await seedBasisgegevens();

  const app = maakApp();
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once('listening', () => resolve()));
  const adres = server.address() as AddressInfo;
  basisUrl = `http://127.0.0.1:${adres.port}`;

  return { client: new Client(basisUrl), basis: basisUrl };
}

export async function stopTestomgeving(): Promise<void> {
  server?.close();
  server = null;
  const { sluitDb } = await import('../src/db/pool.ts');
  await sluitDb();
}

/** Een nieuwe client op dezelfde server, voor een tweede gebruiker. */
export function nieuweClient(): Client {
  return new Client(basisUrl);
}

export type Gebruiker = {
  client: Client;
  gebruikerId: string;
  email: string;
};

let teller = 0;

/**
 * Wist de tellers van de snelheidsbegrenzing. In de tests komen alle verzoeken
 * van hetzelfde adres, dus zonder dit lopen we tegen de limiet aan die juist
 * bedoeld is om misbruik van buiten te stoppen. De limiet zelf wordt apart
 * getest in ratelimit.test.ts.
 */
export async function wisSnelheidsbegrenzing(): Promise<void> {
  await db().query('DELETE FROM rate_limit');
}

/** Registreert een gebruiker en meldt hem aan. */
export async function maakGebruiker(naam = 'Test Gebruiker'): Promise<Gebruiker> {
  await wisSnelheidsbegrenzing();
  teller += 1;
  const email = `test${teller}-${Date.now()}@voorbeeld.test`;
  const wachtwoord = 'een lang testwachtwoord';
  const client = nieuweClient();

  const registratie = await client.post('/api/v1/auth/register', { email, naam, wachtwoord });
  if (registratie.status !== 202) {
    throw new Error(`Registreren mislukte: ${registratie.status} ${JSON.stringify(registratie.body)}`);
  }

  const aanmelding = await client.post('/api/v1/auth/login', { email, wachtwoord });
  if (aanmelding.status !== 200) {
    throw new Error(`Aanmelden mislukte: ${aanmelding.status} ${JSON.stringify(aanmelding.body)}`);
  }
  client.zetToken(aanmelding.body.token);

  const ik = await client.get('/api/v1/auth/me');
  return { client, gebruikerId: ik.body.gebruiker.id, email };
}

export type Administratie = {
  organisatieId: string;
  administratieId: string;
  /** Handige verkorting voor paden. */
  pad: string;
};

/** Maakt een organisatie met een administratie. */
export async function maakAdministratie(
  gebruiker: Gebruiker,
  opties: { organisatie?: string; administratie?: string; sjabloon?: 'zzp' | 'bv' | 'stichting' | 'vereniging' } = {},
): Promise<Administratie> {
  const organisatie = await gebruiker.client.post('/api/v1/organisaties', {
    naam: opties.organisatie ?? `Testorganisatie ${Date.now()}`,
    abonnement: 'mkb',
  });
  if (organisatie.status !== 201) {
    throw new Error(`Organisatie aanmaken mislukte: ${JSON.stringify(organisatie.body)}`);
  }
  const organisatieId = organisatie.body.organisatieId;

  const jaar = new Date().getUTCFullYear();
  const administratie = await gebruiker.client.post(`/api/v1/organisaties/${organisatieId}/administraties`, {
    naam: opties.administratie ?? 'Testadministratie',
    schemaSjabloon: opties.sjabloon ?? 'zzp',
    kvkNummer: '12345678',
    btwNummer: 'NL123456789B01',
    adres: 'Teststraat 1',
    postcodePlaats: '1234 AB Teststad',
    email: 'administratie@voorbeeld.test',
    iban: 'NL91ABNA0417164300',
    boekjaarBegint: `${jaar}-01-01`,
    boekjaarEindigt: `${jaar}-12-31`,
  });
  if (administratie.status !== 201) {
    throw new Error(`Administratie aanmaken mislukte: ${JSON.stringify(administratie.body)}`);
  }

  const administratieId = administratie.body.administratieId;
  return { organisatieId, administratieId, pad: `/api/v1/administraties/${administratieId}` };
}

/** Zoekt een grootboekrekening op code binnen een administratie. */
export async function rekeningId(gebruiker: Gebruiker, admin: Administratie, code: string): Promise<string> {
  const antwoord = await gebruiker.client.get(`${admin.pad}/rekeningen`);
  const rekening = antwoord.body.rekeningen.find((r: { code: string }) => r.code === code);
  if (!rekening) throw new Error(`Rekening ${code} bestaat niet in deze administratie.`);
  return rekening.id;
}

/** Zoekt een btw-code op code binnen een administratie. */
export async function btwCodeId(gebruiker: Gebruiker, admin: Administratie, code: string): Promise<string> {
  const antwoord = await gebruiker.client.get(`${admin.pad}/btwcodes`);
  const btw = antwoord.body.btwcodes.find((c: { code: string }) => c.code === code);
  if (!btw) throw new Error(`Btw-code ${code} bestaat niet in deze administratie.`);
  return btw.id;
}

/** Rechtstreekse databasetoegang binnen een tenantcontext, voor controles. */
export async function inDb<T>(
  administratieId: string | null,
  organisatieId: string | null,
  werk: (client: Db) => Promise<T>,
): Promise<T> {
  return inTransactie(
    { organisatieId, administratieId, gebruikerId: null, actorSoort: 'systeem' },
    werk,
  );
}

/** Rechtstreekse query zonder tenantcontext; hoort nul rijen op te leveren. */
export async function zonderContext<T extends Record<string, unknown>>(sql: string, parameters: unknown[] = []): Promise<T[]> {
  return inTransactie(SYSTEEM_CONTEXT, async (client) => {
    const { rows } = await client.query<T>(sql, parameters);
    return rows;
  });
}

export { db };
