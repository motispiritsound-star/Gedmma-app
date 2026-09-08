/**
 * De mailadapter: kiest hij de juiste driver, en geeft de SMTP-driver door wat
 * hij moet doorgeven?
 *
 * Er komt hier geen mailserver aan te pas. De driver krijgt een neptransport
 * opgedrongen dat vastlegt wat hij zou versturen; dat is precies het stuk dat
 * kapot kan gaan zonder dat een test het merkt.
 */
import './omgeving.ts';
import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Transporter } from 'nodemailer';
import { config } from '../src/config.ts';
import { mail, vergeetDriver } from '../src/mail/index.ts';
import { gebruikTransport, smtpDriver } from '../src/mail/smtp.ts';

const oorspronkelijk = { driver: config.mail.driver, smtpUrl: config.mail.smtpUrl };

/** Een transport dat niets verstuurt maar wel onthoudt wat het kreeg. */
function neptransport(uitkomst: { messageId?: string; rejected?: string[] } = {}) {
  const verstuurd: Record<string, unknown>[] = [];
  const transport = {
    async sendMail(opties: Record<string, unknown>) {
      verstuurd.push(opties);
      return { messageId: uitkomst.messageId ?? '<test@mizen>', rejected: uitkomst.rejected ?? [] };
    },
  };
  return { transport: transport as unknown as Transporter, verstuurd };
}

beforeEach(() => {
  vergeetDriver();
  gebruikTransport(null);
});

afterEach(() => {
  config.mail.driver = oorspronkelijk.driver;
  config.mail.smtpUrl = oorspronkelijk.smtpUrl;
  vergeetDriver();
  gebruikTransport(null);
});

describe('welke driver wordt gekozen', () => {
  test('zonder instelling schrijft hij naar het logboek', () => {
    config.mail.driver = 'logboek';
    assert.equal(mail(), mail(), 'de driver wordt hergebruikt en niet elke keer opnieuw gemaakt');
  });

  test('met smtp maar zonder SMTP_URL valt hij er meteen over', () => {
    config.mail.driver = 'smtp';
    config.mail.smtpUrl = '';
    assert.throws(() => mail(), /SMTP_URL/);
  });

  test('met smtp en een adres kiest hij de smtp-driver', () => {
    config.mail.driver = 'smtp';
    config.mail.smtpUrl = 'smtps://gebruiker:geheim@smtp.voorbeeld.test:465';
    assert.equal(mail(), smtpDriver);
  });
});

describe('wat de smtp-driver doorgeeft', () => {
  test('adres, onderwerp, tekst en bijlage komen ongeschonden aan', async () => {
    const { transport, verstuurd } = neptransport();
    gebruikTransport(transport);

    const uitkomst = await smtpDriver.verstuur({
      aan: 'klant@voorbeeld.test',
      onderwerp: 'Factuur 2026-0001',
      tekst: 'Bijgaand de factuur.',
      bijlagen: [{ bestandsnaam: 'factuur.pdf', mime: 'application/pdf', inhoud: Buffer.from('%PDF-1.4') }],
    });

    assert.equal(uitkomst.verzonden, true);
    assert.equal(uitkomst.driver, 'smtp');
    assert.equal(verstuurd.length, 1);

    const bericht = verstuurd[0]!;
    assert.equal(bericht.to, 'klant@voorbeeld.test');
    assert.equal(bericht.subject, 'Factuur 2026-0001');
    assert.equal(bericht.text, 'Bijgaand de factuur.');
    assert.equal(bericht.from, config.mail.afzender);

    const bijlagen = bericht.attachments as { filename: string; contentType: string; content: Buffer }[];
    assert.equal(bijlagen.length, 1);
    assert.equal(bijlagen[0]!.filename, 'factuur.pdf');
    assert.equal(bijlagen[0]!.contentType, 'application/pdf');
    assert.equal(bijlagen[0]!.content.toString(), '%PDF-1.4');
  });

  test('een bericht zonder bijlagen stuurt geen lege lijst mee', async () => {
    const { transport, verstuurd } = neptransport();
    gebruikTransport(transport);

    await smtpDriver.verstuur({ aan: 'iemand@voorbeeld.test', onderwerp: 'Hallo', tekst: 'Dag.' });
    assert.equal(verstuurd[0]!.attachments, undefined);
  });

  test('een geweigerd adres telt niet als verzonden', async () => {
    // De mailserver accepteert de verbinding maar wijst de ontvanger af. Zonder
    // controle zou de applicatie melden dat het gelukt is en zou niemand ooit
    // ontdekken dat de factuur nergens is aangekomen.
    const { transport } = neptransport({ rejected: ['bestaat-niet@voorbeeld.test'] });
    gebruikTransport(transport);

    await assert.rejects(
      () => smtpDriver.verstuur({ aan: 'bestaat-niet@voorbeeld.test', onderwerp: 'Test', tekst: 'Test.' }),
      /weigerde/,
    );
  });
});
