/**
 * De SMTP-driver: hiermee gaat er echt post de deur uit.
 *
 * Eén verbinding voor het hele proces, want een nieuwe TCP- en TLS-handshake
 * per bericht is trager dan het versturen zelf, en veel providers tellen het
 * aantal verbindingen mee in hun limiet.
 *
 * Wat hier bewust *niet* gebeurt: de inhoud van een bericht loggen. Een factuur
 * of een uitnodigingslink hoort niet in een logbestand terecht te komen, waar
 * hij vervolgens meelift in elke back-up en elk foutrapport.
 */
import { createTransport, type Transporter } from 'nodemailer';
import { config } from '../config.ts';
import { log } from '../util/log.ts';
import type { Bericht, MailDriver, Verzendresultaat } from './index.ts';

/**
 * Vertaalt de SMTP_URL naar verbindingsopties.
 *
 * De url wordt hier zelf uit elkaar gehaald in plaats van doorgegeven, omdat we
 * er dan pooling bij kunnen zetten en omdat het wachtwoord percent-gecodeerd in
 * de url staat: een wachtwoord met een `@` of een `/` erin komt anders verminkt
 * bij de mailserver aan, met een aanmeldfout die nergens naar het wachtwoord
 * wijst.
 */
export function verbindingsopties(smtpUrl: string) {
  const url = new URL(smtpUrl);
  // smtps praat versleuteld vanaf de eerste byte (meestal 465); smtp begint
  // onversleuteld en schakelt over met STARTTLS (meestal 587).
  const versleuteldVanafHetBegin = url.protocol === 'smtps:';
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : versleuteldVanafHetBegin ? 465 : 587,
    secure: versleuteldVanafHetBegin,
    auth: url.username
      ? { user: decodeURIComponent(url.username), pass: decodeURIComponent(url.password) }
      : undefined,
    // Berichten over dezelfde verbinding, met een rustige limiet: een
    // herinneringsronde over honderd facturen mag geen reden zijn om als
    // spammer te worden aangezien.
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  };
}

/**
 * De verbinding wordt pas gemaakt bij het eerste bericht. Zo valt de API niet
 * om als de mailserver even niet bereikbaar is terwijl er nog niets te
 * versturen valt.
 */
let transport: Transporter | null = null;

function verbinding(): Transporter {
  if (transport) return transport;
  if (!config.mail.smtpUrl) {
    throw new Error('MAIL_DRIVER staat op smtp, maar SMTP_URL is leeg. Zet hem in .env.');
  }
  transport = createTransport(verbindingsopties(config.mail.smtpUrl));
  return transport;
}

export const smtpDriver: MailDriver = {
  async verstuur(bericht: Bericht): Promise<Verzendresultaat> {
    const uitkomst = await verbinding().sendMail({
      from: config.mail.afzender,
      to: bericht.aan,
      replyTo: bericht.antwoordAan,
      subject: bericht.onderwerp,
      text: bericht.tekst,
      html: bericht.html,
      attachments: bericht.bijlagen?.map((bijlage) => ({
        filename: bijlage.bestandsnaam,
        contentType: bijlage.mime,
        content: bijlage.inhoud,
      })),
    });

    // Wel het spoor, niet de inhoud: aan wie, waarover, en het kenmerk waarmee
    // je het bericht bij je provider terugvindt als iemand zegt het nooit te
    // hebben ontvangen.
    log.info('E-mail verzonden', {
      aan: bericht.aan,
      onderwerp: bericht.onderwerp,
      kenmerk: uitkomst.messageId,
      geweigerd: uitkomst.rejected?.length ? uitkomst.rejected : undefined,
    });

    // Een adres dat de server weigert is geen fout op verbindingsniveau; je
    // krijgt gewoon een resultaat terug met dat adres in `rejected`. Zonder
    // deze controle zou de applicatie melden dat het gelukt is.
    if (uitkomst.rejected?.length) {
      throw new Error(`De mailserver weigerde: ${uitkomst.rejected.join(', ')}`);
    }

    return {
      verzonden: true,
      driver: 'smtp',
      bericht: `Verstuurd naar ${bericht.aan}.`,
    };
  },
};

/** Alleen voor tests: de verbinding vergeten, zodat de volgende opnieuw opbouwt. */
export function vergeetVerbinding(): void {
  transport = null;
}

/**
 * Alleen voor tests: een eigen transport opdringen, zodat de driver getest kan
 * worden zonder dat er een mailserver aan te pas komt.
 */
export function gebruikTransport(eigen: Transporter | null): void {
  transport = eigen;
}
