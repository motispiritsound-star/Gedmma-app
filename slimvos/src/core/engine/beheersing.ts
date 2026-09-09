import { MAX_NIVEAU, MIN_NIVEAU } from '../types';

/** Wat de app per onderwerp onthoudt om het niveau mee te sturen. */
export interface Beheersing {
  onderwerpId: string;
  niveau: number;
  goed: number;
  fout: number;
  /** Aantal goede antwoorden op rij op het huidige niveau. */
  reeksGoed: number;
  /** Aantal foute antwoorden op rij op het huidige niveau. */
  reeksFout: number;
  /** 0 t/m 3 sterren; sterren gaan nooit meer omlaag. */
  sterren: number;
  laatstGeoefend: number;
}

export const OMHOOG_NA = 4;
export const OMLAAG_NA = 2;

export function nieuweBeheersing(onderwerpId: string, startNiveau: number, nu = Date.now()): Beheersing {
  return {
    onderwerpId,
    niveau: Math.min(MAX_NIVEAU, Math.max(MIN_NIVEAU, startNiveau)),
    goed: 0,
    fout: 0,
    reeksGoed: 0,
    reeksFout: 0,
    sterren: 0,
    laatstGeoefend: nu,
  };
}

/**
 * Werkt de beheersing bij na één antwoord.
 *
 * Het niveau gaat omhoog na vier goede antwoorden op rij en omlaag na twee
 * foute op rij. Zo blijft het tempo hoog genoeg om uitdagend te zijn, maar
 * zakt een kind dat vastloopt snel terug naar iets wat wél lukt.
 */
export function naAntwoord(b: Beheersing, goed: boolean, nu = Date.now()): Beheersing {
  const uit: Beheersing = { ...b, laatstGeoefend: nu };
  if (goed) {
    uit.goed += 1;
    uit.reeksGoed += 1;
    uit.reeksFout = 0;
    if (uit.reeksGoed >= OMHOOG_NA && uit.niveau < MAX_NIVEAU) {
      uit.niveau += 1;
      uit.reeksGoed = 0;
    } else if (uit.reeksGoed >= OMHOOG_NA && uit.niveau === MAX_NIVEAU) {
      uit.reeksGoed = 0;
    }
  } else {
    uit.fout += 1;
    uit.reeksFout += 1;
    uit.reeksGoed = 0;
    if (uit.reeksFout >= OMLAAG_NA && uit.niveau > MIN_NIVEAU) {
      uit.niveau -= 1;
      uit.reeksFout = 0;
    }
  }
  uit.sterren = Math.max(uit.sterren, sterrenVoor(uit));
  return uit;
}

/**
 * Sterren staan voor "dit onderwerp beheers je". Ze vragen zowel een hoog
 * niveau als genoeg goede antwoorden, zodat één gelukstreak niet meteen
 * drie sterren oplevert.
 */
export function sterrenVoor(b: Beheersing): number {
  if (b.niveau >= MAX_NIVEAU && b.goed >= 40) return 3;
  if (b.niveau >= 4 && b.goed >= 20) return 2;
  if (b.niveau >= 3 && b.goed >= 10) return 1;
  return 0;
}

/** Percentage goed, voor het ouderdashboard. */
export function scoreProcent(b: Beheersing): number {
  const totaal = b.goed + b.fout;
  return totaal === 0 ? 0 : Math.round((b.goed / totaal) * 100);
}
