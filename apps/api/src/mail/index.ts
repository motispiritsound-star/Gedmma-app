/**
 * E-mail achter een adapter.
 *
 * In ontwikkeling en tests schrijft de logboek-driver de berichten weg zodat je
 * ze kunt controleren zonder echt te versturen. In productie zet je
 * MAIL_DRIVER=smtp en gaat het over een echte mailserver. Ontbreekt dan de
 * SMTP_URL, dan valt de applicatie daar meteen over: stilzwijgend terugvallen
 * op het logboek zou betekenen dat facturen en uitnodigingen nergens aankomen
 * terwijl het scherm zegt dat ze verstuurd zijn.
 */
import { config } from '../config.ts';
import { log } from '../util/log.ts';
import { smtpDriver } from './smtp.ts';

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
    if (!config.mail.smtpUrl) {
      throw new Error('MAIL_DRIVER staat op smtp, maar SMTP_URL is leeg. Zet hem in .env.');
    }
    driver = smtpDriver;
    return driver;
  }
  driver = logboekDriver;
  return driver;
}

/** Alleen voor tests: de gekozen driver vergeten, zodat de volgende keuze opnieuw wordt gemaakt. */
export function vergeetDriver(): void {
  driver = null;
}

/** Alleen voor tests: alles wat de logboek-driver heeft "verzonden". */
export function verzondenBerichten(): readonly Bericht[] {
  return verzondenInGeheugen;
}

export function wisVerzonden(): void {
  verzondenInGeheugen.length = 0;
}
