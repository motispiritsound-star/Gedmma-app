import express, { type Request, type Response, type NextFunction } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { queryLeads, getLead, kaartPunten, countLeads, plaatsen, type LeadFilter } from '../report/leads.ts';
import { db, stats } from '../db/index.ts';
import { login, logUit, sessieGebruiker, maakGebruiker, gebruikers, zetActief, wijzigWachtwoord,
         ruimSessiesOp, type Gebruiker } from '../db/team.ts';
import { FASES, activiteiten, bewaarTestimonial, claim, logActiviteit, maakKlant, omzet, opdrachten,
         teamOverzicht, trechter, wijsToe, zegKlantOp, zetFase, zetVolgendeActie,
         type Fase, type Soort } from '../db/pipeline.ts';
import { buildReport } from '../report/pitch.ts';
import { RECHTSVORMEN, benaderbaarheid, blokkeer, deblokkeer, legToestemmingVast,
         magBellen, magMailen, trekToestemmingIn, zetRechtsvorm,
         type RechtsvormId } from '../db/contact.ts';
import { SJABLONEN, renderSjabloon, stelSjabloonVoor } from '../report/templates.ts';
import { aanbodTekst, bewaarAanbod, leesAanbod } from '../db/instellingen.ts';
import { toCsv } from '../util/csv.ts';
import { log } from '../util/log.ts';
import { config } from '../config.ts';

const here = dirname(fileURLToPath(import.meta.url));
const COOKIE = 'webscan_sessie';

type Verzoek = Request & { gebruiker?: Gebruiker };

// --- hulpjes ---------------------------------------------------------------

const getal = (waarde: unknown, standaard?: number): number | undefined => {
  const parsed = Number(waarde);
  return Number.isFinite(parsed) ? parsed : standaard;
};

function leesCookie(req: Request, naam: string): string | undefined {
  const ruw = req.headers.cookie;
  if (!ruw) return undefined;
  for (const deel of ruw.split(';')) {
    const [sleutel, ...rest] = deel.trim().split('=');
    if (sleutel === naam) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function zetSessieCookie(res: Response, token: string, dagen = 14): void {
  const delen = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${dagen * 86400}`,
  ];
  if (config.achterHttps) delen.push('Secure');
  res.setHeader('Set-Cookie', delen.join('; '));
}

function filterUitQuery(query: Record<string, unknown>, ikId?: number): LeadFilter {
  return {
    maxScore: getal(query.maxScore),
    minScore: getal(query.minScore),
    grade: (query.grade as string) || undefined,
    city: (query.city as string) || undefined,
    branch: (query.branch as string) || undefined,
    source: (query.source as string) || undefined,
    fase: (query.fase as string) || undefined,
    agentId: getal(query.agent),
    alleenVrij: query.vrij === '1',
    vanCollegas: query.collegas === '1' ? ikId : undefined,
    alleenBelbaar: query.belbaar === '1',
    minLeven: query.levend === '1' ? 45 : undefined,
    achteruit: query.achteruit === '1',
    toonGeblokkeerd: query.geblokkeerd === '1',
    metContact: query.metContact === '1',
    metCoordinaten: query.opKaart === '1',
    includeOffline: query.includeOffline !== '0',
    search: (query.zoek as string) || undefined,
    sort: (query.sort as LeadFilter['sort']) || 'prioriteit',
    limit: getal(query.limit, 100),
    offset: getal(query.offset, 0),
  };
}

// --- inlogpogingen afremmen ------------------------------------------------

const pogingen = new Map<string, { aantal: number; tot: number }>();

function teVaakGeprobeerd(sleutel: string): boolean {
  const staat = pogingen.get(sleutel);
  if (!staat) return false;
  if (Date.now() > staat.tot) { pogingen.delete(sleutel); return false; }
  return staat.aantal >= 10;
}

function telPoging(sleutel: string): void {
  const staat = pogingen.get(sleutel);
  if (!staat || Date.now() > staat.tot) {
    pogingen.set(sleutel, { aantal: 1, tot: Date.now() + 15 * 60_000 });
    return;
  }
  staat.aantal++;
}

// --- server ----------------------------------------------------------------

export async function startServer(port: number): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  app.disable('x-powered-by');
  app.use(express.static(join(here, 'public')));

  ruimSessiesOp();

  const meld = (res: Response, code: number, bericht: string): void => { res.status(code).json({ fout: bericht }); };

  /** Vult req.gebruiker als er een geldige sessie is. */
  const herken = (req: Verzoek, _res: Response, next: NextFunction): void => {
    req.gebruiker = sessieGebruiker(leesCookie(req, COOKIE)) ?? undefined;
    next();
  };

  const vereistLogin = (req: Verzoek, res: Response, next: NextFunction): void => {
    if (!req.gebruiker) { meld(res, 401, 'Log eerst in.'); return; }
    next();
  };

  const vereistEigenaar = (req: Verzoek, res: Response, next: NextFunction): void => {
    if (req.gebruiker?.rol !== 'eigenaar') { meld(res, 403, 'Alleen de eigenaar kan dit.'); return; }
    next();
  };

  app.use(herken);

  // --- inloggen ---
  app.get('/api/mij', (req: Verzoek, res) => {
    const aantalGebruikers = Number(
      (db().prepare('SELECT COUNT(*) n FROM gebruikers').get() as { n: number }).n);
    res.json({
      ingelogd: Boolean(req.gebruiker),
      gebruiker: req.gebruiker ?? null,
      geenGebruikers: aantalGebruikers === 0,
    });
  });

  app.post('/api/login', (req, res) => {
    const { email, wachtwoord } = req.body as { email?: string; wachtwoord?: string };
    const sleutel = `${req.ip}|${(email ?? '').toLowerCase()}`;
    if (teVaakGeprobeerd(sleutel)) {
      meld(res, 429, 'Te veel pogingen. Probeer het over een kwartier opnieuw.');
      return;
    }
    if (!email || !wachtwoord) { meld(res, 400, 'Vul je e-mailadres en wachtwoord in.'); return; }

    const token = login(email, wachtwoord);
    if (!token) { telPoging(sleutel); meld(res, 401, 'Dat e-mailadres en wachtwoord horen niet bij elkaar.'); return; }

    pogingen.delete(sleutel);
    zetSessieCookie(res, token);
    res.json({ ok: true, gebruiker: sessieGebruiker(token) });
  });

  app.post('/api/uitloggen', (req, res) => {
    logUit(leesCookie(req, COOKIE));
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
    res.json({ ok: true });
  });

  app.post('/api/wachtwoord', vereistLogin, (req: Verzoek, res) => {
    const { nieuw } = req.body as { nieuw?: string };
    try {
      wijzigWachtwoord(req.gebruiker!.id, nieuw ?? '');
      res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
      res.json({ ok: true, opnieuwInloggen: true });
    } catch (fout) { meld(res, 400, (fout as Error).message); }
  });

  // --- overzicht ---
  app.get('/api/overzicht', vereistLogin, (req: Verzoek, res) => {
    const eigenAgent = req.gebruiker!.rol === 'agent' ? req.gebruiker!.id : null;
    const verdeling = db().prepare(`
      SELECT grade, COUNT(*) AS aantal FROM leads WHERE score IS NOT NULL GROUP BY grade
    `).all() as unknown as { grade: string; aantal: number }[];

    res.json({
      cijfers: stats(),
      verdeling: ['A', 'B', 'C', 'D', 'F'].map((grade) => ({
        grade, aantal: Number(verdeling.find((rij) => rij.grade === grade)?.aantal ?? 0),
      })),
      trechter: trechter(eigenAgent),
      fases: FASES,
      opdrachten: opdrachten(eigenAgent),
      mijnOpenLeads: countLeads({ agentId: req.gebruiker!.id, maxScore: 100 }),
      omzet: req.gebruiker!.rol === 'eigenaar' ? omzet() : null,
      benaderbaarheid: benaderbaarheid(),
      rechtsvormen: RECHTSVORMEN,
      plaatsen: plaatsen().slice(0, 40),
      agenten: gebruikers().filter((g) => g.actief).map((g) => ({ id: g.id, naam: g.naam, rol: g.rol })),
    });
  });

  // --- leads ---
  app.get('/api/leads', vereistLogin, (req: Verzoek, res) => {
    const filter = filterUitQuery(req.query as Record<string, unknown>, req.gebruiker!.id);
    res.json({ leads: queryLeads(filter), totaal: countLeads(filter) });
  });

  app.get('/api/kaart', vereistLogin, (req: Verzoek, res) => {
    const filter = filterUitQuery(req.query as Record<string, unknown>, req.gebruiker!.id);
    res.json({ punten: kaartPunten({ ...filter, limit: getal(req.query.limit, 5000) }) });
  });

  app.get('/api/leads/:id', vereistLogin, (req, res) => {
    const lead = getLead(Number(req.params.id));
    if (!lead) { meld(res, 404, 'Die lead bestaat niet.'); return; }
    res.json({
      ...lead,
      geschiedenis: activiteiten(lead.id),
      bellen: magBellen(lead),
      mailen: magMailen(lead),
    });
  });

  app.get('/api/sjablonen', vereistLogin, (_req, res) => {
    res.json({
      sjablonen: SJABLONEN.map((sjabloon) => ({
        id: sjabloon.id, naam: sjabloon.naam, wanneer: sjabloon.wanneer, naFase: sjabloon.naFase,
      })),
    });
  });

  app.get('/api/leads/:id/mail', vereistLogin, (req: Verzoek, res) => {
    const lead = getLead(Number(req.params.id));
    if (!lead) { meld(res, 404, 'Die lead bestaat niet.'); return; }

    const rapport = lead.report as { verdict?: never; signals?: never };
    if (!rapport?.verdict) { meld(res, 409, 'Deze lead is nog niet gescand.'); return; }

    const aanbod = leesAanbod();
    const context = {
      bedrijf: lead.name, domein: lead.domain, plaats: lead.city,
      verdict: rapport.verdict, signals: rapport.signals ?? null,
      aanbod: aanbodTekst(aanbod),
      afzender: {
        naam: (req.query.naam as string) || req.gebruiker!.naam,
        bedrijf: (req.query.bedrijf as string) || aanbod.bedrijfsnaam || undefined,
        telefoon: (req.query.telefoon as string) || aanbod.telefoon || undefined,
        email: (req.query.email as string) || req.gebruiker!.email,
      },
    };

    const bellen = magBellen(lead);
    const voorgesteld = stelSjabloonVoor(rapport.verdict, bellen.mag);
    const gekozen = (req.query.sjabloon as string) || voorgesteld;
    try {
      res.json({
        ...renderSjabloon(gekozen, context, lead.contact.emails[0] ?? null),
        voorgesteld,
        aan: lead.contact.emails[0] ?? null,
        rapport: buildReport({
          companyName: lead.name, domain: lead.domain, city: lead.city,
          verdict: rapport.verdict, signals: rapport.signals ?? null,
        }),
      });
    } catch (fout) { meld(res, 400, (fout as Error).message); }
  });

  // --- werken aan een lead ---
  const magAanLead = (req: Verzoek, res: Response, leadId: number): boolean => {
    if (req.gebruiker!.rol === 'eigenaar') return true;
    const rij = db().prepare('SELECT toegewezen_aan FROM opvolging WHERE company_id = ?').get(leadId) as
      { toegewezen_aan: number | null } | undefined;
    if (!rij?.toegewezen_aan || rij.toegewezen_aan === req.gebruiker!.id) return true;
    meld(res, 403, 'Deze lead staat op naam van een collega.');
    return false;
  };

  app.post('/api/leads/:id/claim', vereistLogin, (req: Verzoek, res) => {
    const gelukt = claim(Number(req.params.id), req.gebruiker!.id);
    if (!gelukt) { meld(res, 409, 'Een collega was je net voor.'); return; }
    res.json({ ok: true });
  });

  app.post('/api/leads/:id/toewijzen', vereistLogin, vereistEigenaar, (req: Verzoek, res) => {
    const { agentId } = req.body as { agentId?: number | null };
    wijsToe(Number(req.params.id), agentId ?? null, req.gebruiker!.id);
    res.json({ ok: true });
  });

  app.post('/api/leads/:id/fase', vereistLogin, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (!magAanLead(req, res, id)) return;
    const { fase, notitie } = req.body as { fase?: string; notitie?: string };
    try {
      zetFase(id, fase as Fase, req.gebruiker!.id, notitie);
      res.json({ ok: true });
    } catch (fout) { meld(res, 400, (fout as Error).message); }
  });

  app.post('/api/leads/:id/activiteit', vereistLogin, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (!magAanLead(req, res, id)) return;
    const { soort, uitkomst, notitie } = req.body as { soort?: Soort; uitkomst?: string; notitie?: string };
    if (!soort) { meld(res, 400, 'Geef aan wat je gedaan hebt.'); return; }

    // Telefoontjes alleen vastleggen als bellen ook mocht — anders zou het
    // dashboard een overtreding netjes archiveren.
    const lead = getLead(id);
    if (lead) {
      const regel = soort === 'gebeld' || soort === 'voicemail' ? magBellen(lead)
        : soort === 'mail' ? magMailen(lead) : { mag: true, reden: '' };
      if (!regel.mag) { meld(res, 403, regel.reden); return; }
    }

    logActiviteit({ companyId: id, gebruikerId: req.gebruiker!.id, soort, uitkomst, notitie });
    res.json({ ok: true });
  });

  app.post('/api/leads/:id/volgende-actie', vereistLogin, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (!magAanLead(req, res, id)) return;
    const { datum } = req.body as { datum?: string | null };
    zetVolgendeActie(id, datum ?? null);
    res.json({ ok: true });
  });

  app.post('/api/leads/:id/klant', vereistLogin, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (!magAanLead(req, res, id)) return;
    const { maandbedrag, pakket, status } = req.body as
      { maandbedrag?: number; pakket?: string; status?: 'proef' | 'actief' };
    const cent = Math.round(Number(maandbedrag ?? 0) * 100);
    if (!Number.isFinite(cent) || cent < 0) { meld(res, 400, 'Vul een geldig maandbedrag in.'); return; }
    maakKlant(id, { door: req.gebruiker!.id, pakket, maandbedragCent: cent, status });
    res.json({ ok: true });
  });

  app.post('/api/leads/:id/opzeggen', vereistLogin, vereistEigenaar, (req, res) => {
    zegKlantOp(Number(req.params.id));
    res.json({ ok: true });
  });

  app.post('/api/leads/:id/testimonial', vereistLogin, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (!magAanLead(req, res, id)) return;
    const { tekst, sterren, contactpersoon, publiceerbaar } = req.body as
      { tekst?: string; sterren?: number; contactpersoon?: string; publiceerbaar?: boolean };
    if (!tekst?.trim()) { meld(res, 400, 'De testimonial is leeg.'); return; }
    bewaarTestimonial(id, {
      tekst, sterren: sterren ?? null, contactpersoon: contactpersoon ?? null,
      publiceerbaar, gebruikerId: req.gebruiker!.id,
    });
    res.json({ ok: true });
  });

  // --- wie mag je benaderen ---
  app.post('/api/leads/:id/toestemming', vereistLogin, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (!magAanLead(req, res, id)) return;
    const { via, bewijs, intrekken } = req.body as { via?: string; bewijs?: string; intrekken?: boolean };
    try {
      if (intrekken) {
        trekToestemmingIn(id);
        logActiviteit({ companyId: id, gebruikerId: req.gebruiker!.id, soort: 'notitie', uitkomst: 'toestemming ingetrokken' });
      } else {
        legToestemmingVast(id, { via: via ?? 'onbekend', bewijs: bewijs ?? '', door: req.gebruiker!.id });
        logActiviteit({
          companyId: id, gebruikerId: req.gebruiker!.id, soort: 'notitie',
          uitkomst: `belafspraak toegestaan (${via ?? 'onbekend'})`, notitie: bewijs,
        });
      }
      res.json({ ok: true });
    } catch (fout) { meld(res, 400, (fout as Error).message); }
  });

  app.post('/api/leads/:id/rechtsvorm', vereistLogin, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (!magAanLead(req, res, id)) return;
    const { rechtsvorm } = req.body as { rechtsvorm?: string };
    if (rechtsvorm && !RECHTSVORMEN.some((vorm) => vorm.id === rechtsvorm)) {
      meld(res, 400, `Onbekende rechtsvorm "${rechtsvorm}".`);
      return;
    }
    zetRechtsvorm(id, (rechtsvorm || null) as RechtsvormId | null);
    res.json({ ok: true });
  });

  app.post('/api/leads/:id/blokkeren', vereistLogin, (req: Verzoek, res) => {
    const { reden, opheffen } = req.body as { reden?: string; opheffen?: boolean };
    const id = Number(req.params.id);
    if (opheffen) {
      if (req.gebruiker!.rol !== 'eigenaar') { meld(res, 403, 'Alleen de eigenaar kan een blokkade opheffen.'); return; }
      deblokkeer(id);
    } else {
      blokkeer(id, reden ?? 'op eigen verzoek', req.gebruiker!.id);
      logActiviteit({
        companyId: id, gebruikerId: req.gebruiker!.id, soort: 'notitie',
        uitkomst: 'niet meer benaderen', notitie: reden,
      });
    }
    res.json({ ok: true });
  });

  // --- instellingen ---
  app.get('/api/instellingen', vereistLogin, (_req, res) => {
    const aanbod = leesAanbod();
    res.json({ aanbod, voorbeeld: aanbodTekst(aanbod) });
  });

  app.put('/api/instellingen', vereistLogin, vereistEigenaar, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const aanbod = bewaarAanbod({
      soort: body.soort === 'startbedrag' ? 'startbedrag' : body.soort === 'gratis' ? 'gratis' : undefined,
      startbedragCent: body.startbedrag !== undefined ? Math.round(Number(body.startbedrag) * 100) : undefined,
      maandbedragCent: body.maandbedrag !== undefined ? Math.round(Number(body.maandbedrag) * 100) : undefined,
      inbegrepen: body.inbegrepen as string | undefined,
      bedrijfsnaam: body.bedrijfsnaam as string | undefined,
      telefoon: body.telefoon as string | undefined,
    });
    res.json({ aanbod, voorbeeld: aanbodTekst(aanbod) });
  });

  // --- team ---
  app.get('/api/team', vereistLogin, vereistEigenaar, (_req, res) => {
    res.json({ team: teamOverzicht(), gebruikers: gebruikers(), omzet: omzet() });
  });

  app.post('/api/team', vereistLogin, vereistEigenaar, (req, res) => {
    const { naam, email, wachtwoord, rol } = req.body as
      { naam?: string; email?: string; wachtwoord?: string; rol?: 'eigenaar' | 'agent' };
    if (!naam || !email || !wachtwoord) { meld(res, 400, 'Naam, e-mailadres en wachtwoord zijn nodig.'); return; }
    try {
      res.json({ ok: true, gebruiker: maakGebruiker({ naam, email, wachtwoord, rol }) });
    } catch (fout) { meld(res, 400, (fout as Error).message); }
  });

  app.post('/api/team/:id/actief', vereistLogin, vereistEigenaar, (req: Verzoek, res) => {
    const id = Number(req.params.id);
    if (id === req.gebruiker!.id) { meld(res, 400, 'Je kunt jezelf niet op inactief zetten.'); return; }
    zetActief(id, Boolean((req.body as { actief?: boolean }).actief));
    res.json({ ok: true });
  });

  // --- export ---
  app.get('/api/export.csv', vereistLogin, (req: Verzoek, res) => {
    const leads = queryLeads({
      ...filterUitQuery(req.query as Record<string, unknown>, req.gebruiker!.id), limit: 100_000, offset: 0,
    });
    const rijen = leads.map((lead) => ({
      bedrijf: lead.name, website: lead.website, plaats: lead.city ?? '',
      rechtsvorm: lead.rechtsvorm ?? '',
      prioriteit: lead.prioriteit ?? '', score: lead.score ?? '', beoordeling: lead.grade ?? '',
      levenstekenen: lead.leven ?? '',
      mag_bellen: magBellen(lead).mag ? 'ja' : 'nee',
      telefoon: lead.contact.phones.join(' / '), email: lead.contact.emails.join(' / '),
      whatsapp: lead.contact.whatsapp ?? '',
      adres: [lead.contact.adres?.adres, lead.contact.adres?.postcode, lead.contact.adres?.plaats]
        .filter(Boolean).join(', '),
      kvk: lead.contact.kvk ?? '',
      belangrijkste_probleem: lead.topIssues[0]?.title ?? '',
      fase: lead.fase, agent: lead.agent_naam ?? '',
    }));
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename="leads.csv"');
    res.send(toCsv(rijen));
  });

  await new Promise<void>((klaar) => {
    app.listen(port, () => {
      log.ok(`Dashboard draait op http://localhost:${port}`);
      klaar();
    });
  });
}
