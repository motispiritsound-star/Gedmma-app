/** Routes voor registreren, aanmelden, MFA en sessies. */
import { Router } from 'express';
import { z, valideer } from '../http/valideer.ts';
import { eisAangemeld, tenantVan, type Verzoek } from '../http/context.ts';
import { SESSIE_COOKIE, eisAanmelding } from '../http/middleware.ts';
import { ApiFout } from '../http/fout.ts';
import {
  actieveSessies,
  begintMfaOpzet,
  bevestigMfa,
  meldAan,
  meldAf,
  heeftMfa,
  registreer,
  schakelMfaUit,
  trekSessiesIn,
  voldoeMfa,
  wijzigWachtwoord,
} from '../auth/service.ts';
import { organisatiesVan } from '../modules/organisaties/service.ts';
import { accepteerUitnodiging } from '../modules/organisaties/leden.ts';
import { asyncRoute, cookieOpties } from './hulp.ts';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const invoer = valideer(
      z.object({
        email: z.string().email('Vul een geldig e-mailadres in'),
        naam: z.string().min(2, 'Vul je naam in').max(200),
        wachtwoord: z.string().min(1, 'Vul een wachtwoord in'),
        locale: z.enum(['nl', 'en', 'de', 'fr']).default('nl'),
      }),
      verzoek.body,
    );

    await registreer({ ...invoer, ip: verzoek.ip });

    // Bewust altijd hetzelfde antwoord: of het adres al bestond mag niet
    // afleidbaar zijn.
    antwoord.status(202).json({
      melding:
        'Als dit e-mailadres nog niet in gebruik was, is het account aangemaakt. Je kunt nu aanmelden.',
    });
  }),
);

authRoutes.post(
  '/login',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const invoer = valideer(
      z.object({ email: z.string().email(), wachtwoord: z.string().min(1) }),
      verzoek.body,
    );

    const sessie = await meldAan({
      ...invoer,
      ip: verzoek.ip,
      userAgent: verzoek.header('user-agent'),
    });

    antwoord.cookie(SESSIE_COOKIE, sessie.token, cookieOpties());
    antwoord.json({
      mfaNodig: sessie.mfaNodig,
      verlooptOp: sessie.verlooptOp,
      // Het token gaat ook in de body mee voor mobiel en desktop, die geen
      // cookies gebruiken.
      token: sessie.token,
    });
  }),
);

authRoutes.post(
  '/mfa/verify',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = verzoek.aangemeld;
    if (!aangemeld) throw new ApiFout('unauthenticated', 'Je bent niet aangemeld.', 'Meld je opnieuw aan.');
    const invoer = valideer(z.object({ code: z.string().min(6).max(12) }), verzoek.body);
    await voldoeMfa(aangemeld.sessieId, aangemeld.gebruikerId, invoer.code, tenantVan(verzoek));
    antwoord.json({ mfaVoldaan: true });
  }),
);

authRoutes.post(
  '/mfa/setup',
  eisAanmelding,
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const opzet = await begintMfaOpzet(aangemeld.gebruikerId, aangemeld.email);
    antwoord.json({
      geheim: opzet.geheim,
      uri: opzet.uri,
      uitleg:
        'Scan de QR-code met een authenticator-app (bijvoorbeeld die van je telefoon) en vul daarna de code van zes cijfers in om te bevestigen.',
    });
  }),
);

authRoutes.post(
  '/mfa/confirm',
  eisAanmelding,
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const invoer = valideer(z.object({ code: z.string().min(6).max(8) }), verzoek.body);
    const uitkomst = await bevestigMfa(aangemeld.gebruikerId, invoer.code, tenantVan(verzoek));
    antwoord.json({
      herstelcodes: uitkomst.herstelcodes,
      uitleg:
        'Bewaar deze herstelcodes op een veilige plek. Elke code werkt een keer en helpt je aanmelden als je je telefoon kwijt bent.',
    });
  }),
);

authRoutes.post(
  '/mfa/disable',
  eisAanmelding,
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const invoer = valideer(z.object({ wachtwoord: z.string().min(1) }), verzoek.body);
    await schakelMfaUit(aangemeld.gebruikerId, invoer.wachtwoord, tenantVan(verzoek));
    antwoord.json({ mfaIngeschakeld: false });
  }),
);

authRoutes.post(
  '/password',
  eisAanmelding,
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const invoer = valideer(
      z.object({ huidig: z.string().min(1), nieuw: z.string().min(1) }),
      verzoek.body,
    );
    await wijzigWachtwoord(aangemeld.gebruikerId, invoer.huidig, invoer.nieuw, tenantVan(verzoek), aangemeld.sessieId);
    antwoord.json({ melding: 'Je wachtwoord is gewijzigd. Andere apparaten zijn afgemeld.' });
  }),
);

authRoutes.post(
  '/logout',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    if (verzoek.aangemeld) {
      await meldAf(verzoek.aangemeld.sessieId, tenantVan(verzoek));
    }
    antwoord.clearCookie(SESSIE_COOKIE, cookieOpties());
    antwoord.json({ melding: 'Je bent afgemeld.' });
  }),
);

authRoutes.post(
  '/invitations/accept',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const invoer = valideer(
      z.object({
        token: z.string().min(20).max(200),
        naam: z.string().min(2).max(200).optional(),
        wachtwoord: z.string().min(1).optional(),
      }),
      verzoek.body,
    );
    const uitkomst = await accepteerUitnodiging(invoer);
    antwoord.json({
      organisatieId: uitkomst.organisatieId,
      melding: 'De uitnodiging is geaccepteerd. Je kunt nu aanmelden.',
    });
  }),
);

authRoutes.get(
  '/me',
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    if (!verzoek.aangemeld) {
      antwoord.json({ aangemeld: false });
      return;
    }
    const aangemeld = verzoek.aangemeld;
    const organisaties = aangemeld.mfaVoldaan ? await organisatiesVan(aangemeld.gebruikerId) : [];
    const mfaIngeschakeld = await heeftMfa(aangemeld.gebruikerId);

    antwoord.json({
      aangemeld: true,
      gebruiker: {
        id: aangemeld.gebruikerId,
        email: aangemeld.email,
        naam: aangemeld.naam,
        locale: aangemeld.locale,
        mfaIngeschakeld,
        mfaVoldaan: aangemeld.mfaVoldaan,
        impersonatie: aangemeld.supportGebruikerId !== null,
      },
      organisaties: organisaties.map((item) => ({
        id: item.organisatie.id,
        naam: item.organisatie.naam,
        abonnement: item.organisatie.abonnement,
        status: item.organisatie.status,
        rol: item.rol,
        administraties: item.administraties,
      })),
    });
  }),
);

authRoutes.get(
  '/sessions',
  eisAanmelding,
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const sessies = await actieveSessies(aangemeld.gebruikerId);
    antwoord.json({
      sessies: sessies.map((sessie) => ({ ...sessie, huidige: sessie.id === aangemeld.sessieId })),
    });
  }),
);

authRoutes.delete(
  '/sessions',
  eisAanmelding,
  asyncRoute(async (verzoek: Verzoek, antwoord) => {
    const aangemeld = eisAangemeld(verzoek);
    const aantal = await trekSessiesIn(aangemeld.gebruikerId, tenantVan(verzoek), aangemeld.sessieId);
    antwoord.json({ ingetrokken: aantal, melding: `${aantal} andere sessie(s) zijn afgemeld.` });
  }),
);
