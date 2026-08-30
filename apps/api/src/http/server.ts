/** De HTTP-applicatie: middleware, routes, health checks en foutafhandeling. */
import express from 'express';
import { config } from '../config.ts';
import { db } from '../db/pool.ts';
import { authRoutes } from '../routes/auth.ts';
import { administratieRoutes, organisatieRoutes } from '../routes/administraties.ts';
import { boekhoudRoutes } from '../routes/boekhouding.ts';
import { urenRoutes } from '../routes/uren.ts';
import {
  aanmelding,
  beveiligingsheaders,
  controleerOorsprong,
  cors,
  foutafhandeling,
  requestId,
  toegangslog,
} from './middleware.ts';
import { ApiFout } from './fout.ts';
import { bouwOpenApi, type Koppeling } from './openapi.ts';

/**
 * De routers en hun montagepad. Deze tabel is de enige plek waar dat staat:
 * `maakApp()` monteert eruit en de OpenAPI-generator leest eruit, zodat de
 * specificatie niet uit de pas kan lopen met de werkelijke routes.
 */
export const koppelingen: Koppeling[] = [
  { basis: '/api/v1/auth', router: authRoutes },
  { basis: '/api/v1/organisaties', router: organisatieRoutes },
  {
    basis: '/api/v1/administraties/:administratieId',
    router: administratieRoutes,
  },
  { basis: '/api/v1/administraties/:administratieId', router: boekhoudRoutes },
  { basis: '/api/v1/administraties/:administratieId', router: urenRoutes },
];

export function maakApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  if (config.beveiliging.achterProxy) app.set('trust proxy', 1);

  app.use(requestId);
  app.use(beveiligingsheaders);
  app.use(cors);
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(controleerOorsprong);
  app.use(toegangslog);
  app.use(aanmelding);

  // Health checks. `live` zegt of het proces draait; `ready` of hij ook werk aankan.
  app.get('/health/live', (_verzoek, antwoord) => {
    antwoord.json({
      status: 'ok',
      versie: process.env.npm_package_version ?? '0.1.0',
    });
  });

  app.get('/health/ready', (_verzoek, antwoord) => {
    db()
      .query('SELECT 1 AS ok')
      .then(async () => {
        const migraties = await db().query<{ aantal: string }>(
          'SELECT count(*)::text AS aantal FROM schema_migration',
        );
        antwoord.json({
          status: 'ok',
          migraties: Number(migraties.rows[0]?.aantal ?? '0'),
        });
      })
      .catch((fout: unknown) => {
        antwoord.status(503).json({
          status: 'niet-gereed',
          reden: 'De database is niet bereikbaar.',
          detail: fout instanceof Error ? fout.message : String(fout),
        });
      });
  });

  // De specificatie beschrijft alleen de vorm van de API, geen gegevens, en is
  // daarom zonder aanmelding op te vragen.
  app.get('/api/v1/openapi.json', (_verzoek, antwoord) => {
    antwoord.json(bouwOpenApi(koppelingen, process.env.npm_package_version ?? '0.1.0'));
  });

  for (const { basis, router } of koppelingen) app.use(basis, router);

  app.use((verzoek, _antwoord, volgende) => {
    volgende(
      new ApiFout(
        'not_found',
        `Er bestaat geen ${verzoek.method} ${verzoek.path}.`,
        'Controleer het adres, of raadpleeg docs/api.md.',
      ),
    );
  });

  app.use(foutafhandeling);

  return app;
}
