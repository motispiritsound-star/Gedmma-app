/**
 * De controle vóór de go-live: staat alles klaar om echt leads te gaan
 * benaderen, of ontbreekt er nog iets?
 *
 * Elk punt hier heeft een reden uit de praktijk. Een user-agent zonder
 * contactgegevens laat beheerders je verkeer blokkeren; een aanbod zonder
 * afzendernaam levert mails af met "[jouw bedrijf]" erin; bedrijven zonder
 * rechtsvorm mag je niet bellen. Beter dat je dat hier leest dan bij de
 * eerste honderd mails.
 */
import { statSync } from 'node:fs';
import { config } from '../config.ts';
import { db, stats } from './index.ts';
import { gebruikers } from './team.ts';
import { leesAanbod } from './instellingen.ts';
import { leesDoel } from './prognose.ts';
import { benaderbaarheid } from './contact.ts';

export type Punt = {
  naam: string;
  staat: 'goed' | 'let-op' | 'blokkeert';
  bevinding: string;
  /** Wat je eraan doet. Leeg als er niets te doen is. */
  actie?: string;
};

export type Controle = {
  punten: Punt[];
  klaar: boolean;
  blokkades: number;
  waarschuwingen: number;
};

const STANDAARD_AGENT = /zet je contactgegevens in WEBSCAN_USER_AGENT/i;

/** Ziet de user-agent eruit als iets waar een beheerder contact mee kan opnemen? */
function agentPunt(): Punt {
  if (STANDAARD_AGENT.test(config.userAgent)) {
    return {
      naam: 'Herkenbare user-agent',
      staat: 'blokkeert',
      bevinding: 'De scanner stelt zich nog voor met de standaardtekst.',
      actie: 'Zet WEBSCAN_USER_AGENT in .env met je eigen naam en een e-mailadres of URL.',
    };
  }
  if (!/https?:\/\/|@/.test(config.userAgent)) {
    return {
      naam: 'Herkenbare user-agent',
      staat: 'let-op',
      bevinding: 'Er staat geen contactmogelijkheid in je user-agent.',
      actie: 'Zet er een e-mailadres of URL bij, zodat beheerders je kunnen bereiken in plaats van blokkeren.',
    };
  }
  return { naam: 'Herkenbare user-agent', staat: 'goed', bevinding: config.userAgent };
}

function databasePunt(): Punt {
  const pad = config.dbPath;
  let grootte = 0;
  try { grootte = statSync(pad).size; } catch { /* bestaat nog niet */ }
  const mb = (grootte / 1_000_000).toFixed(1);

  if (pad.includes('demo.db')) {
    return {
      naam: 'Database', staat: 'blokkeert',
      bevinding: `Je werkt in de proefdatabase (${pad}).`,
      actie: 'Zet WEBSCAN_DB in .env op een eigen bestand, bijvoorbeeld ./data/webscan.db.',
    };
  }
  return { naam: 'Database', staat: 'goed', bevinding: `${pad} (${mb} MB)` };
}

function accountPunt(): Punt {
  const actief = gebruikers().filter((rij) => rij.actief);
  const eigenaren = actief.filter((rij) => rij.rol === 'eigenaar').length;
  if (actief.length === 0) {
    return {
      naam: 'Accounts', staat: 'blokkeert', bevinding: 'Er is nog geen account.',
      actie: 'node start.js gebruiker toevoegen --naam "Jouw naam" --email jij@voorbeeld.nl --rol eigenaar',
    };
  }
  if (eigenaren === 0) {
    return {
      naam: 'Accounts', staat: 'blokkeert', bevinding: 'Er is geen eigenaar.',
      actie: 'Maak een account met --rol eigenaar; alleen die kan het aanbod en het team beheren.',
    };
  }
  const agenten = actief.length - eigenaren;
  return {
    naam: 'Accounts', staat: 'goed',
    bevinding: `${eigenaren} eigenaar${eigenaren === 1 ? '' : 'en'} en ${agenten} agent${agenten === 1 ? '' : 's'}.`,
  };
}

function aanbodPunt(): Punt {
  const aanbod = leesAanbod();
  const ontbreekt: string[] = [];
  if (!aanbod.bedrijfsnaam.trim()) ontbreekt.push('bedrijfsnaam');
  if (!aanbod.telefoon.trim()) ontbreekt.push('telefoon');
  if (ontbreekt.length > 0) {
    return {
      naam: 'Je aanbod', staat: 'blokkeert',
      bevinding: `In de mailsjablonen ontbreekt je ${ontbreekt.join(' en ')} — die komt als "[jouw bedrijf]" in de mail.`,
      actie: 'Vul het in onder Team & omzet → Wat je aanbiedt, of met "node start.js aanbod".',
    };
  }
  const euro = (cent: number) => `€ ${(cent / 100).toFixed(2).replace('.', ',')}`;
  return {
    naam: 'Je aanbod', staat: 'goed',
    bevinding: `${aanbod.soort === 'gratis' ? 'Gratis herbouw' : `Start ${euro(aanbod.startbedragCent)}`}, `
      + `daarna ${euro(aanbod.maandbedragCent)} per maand, namens ${aanbod.bedrijfsnaam}.`,
  };
}

function bedrijvenPunt(): Punt {
  const cijfers = stats();
  if (cijfers.bedrijven === 0) {
    return {
      naam: 'Bedrijven', staat: 'blokkeert', bevinding: 'Er staan nog geen bedrijven in de database.',
      actie: 'node start.js eerste-ronde --plaats "Jouw gemeente"',
    };
  }
  if (cijfers.gescand === 0) {
    return {
      naam: 'Bedrijven', staat: 'blokkeert',
      bevinding: `${cijfers.bedrijven} bedrijven, nog geen enkele gescand.`,
      actie: 'node start.js scan --limit 500',
    };
  }
  const deel = Math.round((cijfers.gescand / cijfers.bedrijven) * 100);
  return {
    naam: 'Bedrijven', staat: deel >= 80 ? 'goed' : 'let-op',
    bevinding: `${cijfers.bedrijven} bedrijven, ${cijfers.gescand} gescand (${deel}%).`,
    actie: deel >= 80 ? undefined : 'Draai "node start.js scan" tot de rest ook gescand is.',
  };
}

/** Zonder contactgegevens kun je niets: dan heb je een lijst, geen leads. */
function contactPunt(): Punt {
  const rij = db().prepare(`
    SELECT COUNT(*) AS gescand,
           SUM(CASE WHEN heeft_telefoon = 1 OR heeft_email = 1 THEN 1 ELSE 0 END) AS metContact
    FROM companies WHERE score IS NOT NULL
  `).get() as { gescand: number; metContact: number | null };

  const gescand = Number(rij.gescand ?? 0);
  const met = Number(rij.metContact ?? 0);
  if (gescand === 0) return { naam: 'Contactgegevens', staat: 'let-op', bevinding: 'Nog niets gescand.' };

  const deel = Math.round((met / gescand) * 100);
  return {
    naam: 'Contactgegevens', staat: deel >= 40 ? 'goed' : 'let-op',
    bevinding: `${met} van de ${gescand} gescande bedrijven heeft een telefoonnummer of e-mailadres (${deel}%).`,
    actie: deel >= 40 ? undefined
      : 'Laag percentage. Importeer een bron met contactgegevens, of scan opnieuw — de contactpagina wordt meegenomen.',
  };
}

/** Bellen zonder bekende rechtsvorm mag niet; dat is de grootste valkuil. */
function belPunt(): Punt {
  const cijfers = benaderbaarheid();
  const totaal = cijfers.magBellen + cijfers.alleenMailen + cijfers.onbekend;
  if (totaal === 0) return { naam: 'Wie je mag bellen', staat: 'let-op', bevinding: 'Nog geen bedrijven om te beoordelen.' };

  const deel = Math.round((cijfers.onbekend / totaal) * 100);
  return {
    naam: 'Wie je mag bellen',
    staat: deel > 60 ? 'let-op' : 'goed',
    bevinding: `${cijfers.magBellen} mag je bellen, ${cijfers.alleenMailen} alleen mailen, `
      + `${cijfers.onbekend} rechtsvorm onbekend (${deel}%).`,
    actie: deel > 60
      ? 'Onbekend telt als "niet bellen". Haal de rechtsvorm op met "node start.js verrijken", of mail eerst.'
      : undefined,
  };
}

function doelPunt(): Punt {
  const doel = leesDoel();
  if (doel === 0) {
    return {
      naam: 'Doel', staat: 'let-op', bevinding: 'Er staat nog geen doel voor de maandomzet.',
      actie: 'node start.js prognose --doel 2500 — dan rekent het dashboard uit hoeveel opdrachten dat vraagt.',
    };
  }
  return { naam: 'Doel', staat: 'goed', bevinding: `€ ${(doel / 100).toFixed(2).replace('.', ',')} per maand.` };
}

function httpsPunt(): Punt {
  if (config.achterHttps) {
    return { naam: 'HTTPS', staat: 'goed', bevinding: 'WEBSCAN_HTTPS=1: de sessiecookie krijgt de Secure-vlag.' };
  }
  return {
    naam: 'HTTPS', staat: 'let-op',
    bevinding: 'WEBSCAN_HTTPS staat uit — prima op je eigen machine, niet op een server.',
    actie: 'Zet WEBSCAN_HTTPS=1 zodra het dashboard achter een reverse proxy met certificaat draait.',
  };
}

export function controle(): Controle {
  const punten = [
    agentPunt(), databasePunt(), accountPunt(), aanbodPunt(),
    bedrijvenPunt(), contactPunt(), belPunt(), doelPunt(), httpsPunt(),
  ];
  const blokkades = punten.filter((punt) => punt.staat === 'blokkeert').length;
  return {
    punten,
    blokkades,
    waarschuwingen: punten.filter((punt) => punt.staat === 'let-op').length,
    klaar: blokkades === 0,
  };
}
