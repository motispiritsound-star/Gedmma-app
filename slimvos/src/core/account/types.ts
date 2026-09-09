import type { Abonnement } from '../abonnement/toegang';

/**
 * Het account is van de ouder, niet van het kind. Kinderen hebben een profiel
 * binnen dat account en hoeven zelf niets in te vullen — geen e-mailadres,
 * geen wachtwoord, geen achternaam.
 */
export interface Ouder {
  id: string;
  email: string;
  naam: string;
  /** Alleen de afgeleide waarde wordt bewaard, nooit het wachtwoord zelf. */
  wachtwoordHash: string;
  salt: string;
  aangemaakt: number;
  abonnement: Abonnement;
  /** Cijfercode die het oudergedeelte afschermt; null = nog niet ingesteld. */
  pincode: string | null;
  nieuwsbrief: boolean;
}

export interface Aanmeldgegevens {
  email: string;
  wachtwoord: string;
  naam: string;
  nieuwsbrief: boolean;
}

/**
 * De app praat alleen via deze poort met "de buitenwereld". Nu zit daar een
 * lokale implementatie achter; om over te stappen op een echte server hoef je
 * alleen een andere implementatie te leveren.
 */
export interface AuthPoort {
  huidigeOuder(): Promise<Ouder | null>;
  registreer(gegevens: Aanmeldgegevens): Promise<Ouder>;
  logIn(email: string, wachtwoord: string): Promise<Ouder>;
  logUit(): Promise<void>;
  vraagHerstel(email: string): Promise<void>;
  wijzigWachtwoord(oud: string, nieuw: string): Promise<void>;
  bewaarOuder(ouder: Ouder): Promise<void>;
  verwijderAccount(): Promise<void>;
}

export class AuthFout extends Error {
  constructor(
    message: string,
    readonly veld?: 'email' | 'wachtwoord' | 'naam',
  ) {
    super(message);
    this.name = 'AuthFout';
  }
}
