/**
 * De omgeving voor de tests, en niets anders.
 *
 * Dit bestand moet als **eerste** worden geïmporteerd, vóór alles wat
 * `config.ts` aanraakt. Reden: een ES-module voert eerst al zijn imports uit en
 * daarna pas zijn eigen regels. Stonden deze toekenningen boven in `hulp.ts`,
 * dan zou `config.ts` al geladen zijn - inclusief het inlezen van `.env` - en
 * draaiden de tests tegen de ontwikkeldatabase in plaats van de testdatabase.
 *
 * Dat is precies wat er een keer is gebeurd: een testrun leegde de database
 * waar de demo-administratie in stond. Vandaar dit bestand, en vandaar de
 * tweede grendel in `leegDatabase()`, die weigert te legen als de database niet
 * herkenbaar een testdatabase is.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://gedmma_app:gedmma_dev@127.0.0.1:5432/gedmma_test';
process.env.DATABASE_MIGRATION_URL = 'postgres://gedmma_owner:gedmma_dev@127.0.0.1:5432/gedmma_test';
process.env.DATABASE_APP_ROLE ??= 'gedmma_app';
process.env.PASSWORD_PEPPER ??= 'test-peper';
process.env.DATA_ENCRYPTION_KEY ??= '1'.repeat(64);
process.env.LOG_LEVEL ??= 'error';
process.env.MAIL_DRIVER ??= 'logboek';
// scrypt met productieparameters maakt de testsuite onnodig traag; de
// correctheid van de hashfunctie wordt apart getest.
process.env.SCRYPT_COST ??= '16384';

// De CI mag een eigen adres opgeven; dan telt dat.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
if (process.env.TEST_DATABASE_MIGRATION_URL) {
  process.env.DATABASE_MIGRATION_URL = process.env.TEST_DATABASE_MIGRATION_URL;
}

export const testomgevingGeladen = true;
