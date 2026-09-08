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
import { gebruikTransport, smtpDriver, verbindingsopties } from '../src/mail/smtp.ts';

// De configuratie is met opzet alleen-lezen: niets in de applicatie hoort hem
// tijdens het draaien te wijzigen. Een test die de driverkeuze wil beproeven
// moet dat wel, en zegt hier expliciet dat hij dat doet.
const instelbaar = config.mail as { driver: 'logboek' | 'smtp'; smtpUrl: string };
const oorspronkelijk = { driver: instelbaar.driver, smtpUrl: instelbaar.smtpUrl };

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
  instelbaar.driver = oorspronkelijk.driver;
  instelbaar.smtpUrl = oorspronkelijk.smtpUrl;
  vergeetDriver();
  gebruikTransport(null);
});

describe('welke driver wordt gekozen', () => {
  test('zonder instelling schrijft hij naar het logboek', () => {
    instelbaar.driver = 'logboek';
    assert.equal(mail(), mail(), 'de driver wordt hergebruikt en niet elke keer opnieuw gemaakt');
  });

  test('met smtp maar zonder SMTP_URL valt hij er meteen over', () => {
    instelbaar.driver = 'smtp';
    instelbaar.smtpUrl = '';
    assert.throws(() => mail(), /SMTP_URL/);
  });

  test('met smtp en een adres kiest hij de smtp-driver', () => {
    instelbaar.driver = 'smtp';
    instelbaar.smtpUrl = 'smtps://gebruiker:geheim@smtp.voorbeeld.test:465';
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

describe('de SMTP_URL uit elkaar halen', () => {
  test('smtps gaat versleuteld over 465', () => {
    const opties = verbindingsopties('smtps://post@voorbeeld.test:geheim@smtp.voorbeeld.test');
    assert.equal(opties.host, 'smtp.voorbeeld.test');
    assert.equal(opties.port, 465);
    assert.equal(opties.secure, true);
  });

  test('smtp begint onversleuteld op 587', () => {
    const opties = verbindingsopties('smtp://gebruiker:geheim@smtp.voorbeeld.test');
    assert.equal(opties.port, 587);
    assert.equal(opties.secure, false);
  });

  test('een poort in de url gaat voor de standaard', () => {
    assert.equal(verbindingsopties('smtps://a:b@smtp.voorbeeld.test:2465').port, 2465);
  });

  test('een wachtwoord met leestekens komt heel aan', () => {
    // Een wachtwoord als `pas@woord/1` moet percent-gecodeerd in de url staan.
    // Zonder decoderen komt er `pas%40woord%2F1` bij de mailserver aan, en dan
    // krijg je een aanmeldfout die nergens naar het wachtwoord wijst.
    const opties = verbindingsopties('smtps://gebruiker:pas%40woord%2F1@smtp.voorbeeld.test');
    assert.deepEqual(opties.auth, { user: 'gebruiker', pass: 'pas@woord/1' });
  });

  test('zonder gebruikersnaam wordt er niet aangemeld', () => {
    assert.equal(verbindingsopties('smtp://smtp.intern.test:25').auth, undefined);
  });
});
