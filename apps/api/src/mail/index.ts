/**
 * E-mail achter een adapter.
 *
 * In ontwikkeling en tests schrijft de logboek-driver de berichten weg zodat je
 * ze kunt controleren zonder echt te versturen. De SMTP-driver hoort bij de
 * productieomgeving; zolang die niet is geconfigureerd wordt dat expliciet
 * gemeld in plaats van stilzwijgend te doen alsof er is verzonden.
 */
import { config } from '../config.ts';
import { log } from '../util/log.ts';

export type Bijlage = { bestandsnaam: string; mime: string; inhoud: Buffer };

export type Bericht = {
  aan: string;
  onderwerp: string;
  tekst: string;
  html?: string;
  bijlagen?: Bijlage[];
  antwoordAan?: string;
};

export type Verzendresultaat = { verzonden: boolean; driver: string; bericht: string };

export type MailDriver = { verstuur(bericht: Bericht): Promise<Verzendresultaat> };

const verzondenInGeheugen: Bericht[] = [];

const logboekDriver: MailDriver = {
  async verstuur(bericht) {
    verzondenInGeheugen.push(bericht);
    log.info('E-mail (logboek-driver, niet echt verzonden)', {
      aan: bericht.aan,
      onderwerp: bericht.onderwerp,
      bijlagen: bericht.bijlagen?.map((b) => b.bestandsnaam) ?? [],
    });
    return {
      verzonden: true,
      driver: 'logboek',
      bericht: 'Het bericht is vastgelegd in het logboek; er is niets echt verstuurd.',
    };
  },
};

let driver: MailDriver | null = null;

export function mail(): MailDriver {
  if (driver) return driver;
  if (config.mail.driver === 'smtp') {
    throw new Error(
      'De SMTP-driver is nog niet geimplementeerd. Zet MAIL_DRIVER=logboek voor ontwikkeling, of voeg de driver toe in apps/api/src/mail/smtp.ts.',
    );
  }
  driver = logboekDriver;
  return driver;
}

/** Alleen voor tests: alles wat de logboek-driver heeft "verzonden". */
export function verzondenBerichten(): readonly Bericht[] {
  return verzondenInGeheugen;
}

export function wisVerzonden(): void {
  verzondenInGeheugen.length = 0;
}
