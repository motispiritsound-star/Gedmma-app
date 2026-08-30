-- Relaties, artikelen, verkoop, inkoop, betalingen, bank en documenten.

CREATE TABLE contact (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  nummer            text,
  naam              text NOT NULL,
  soort             text NOT NULL DEFAULT 'klant'
                      CHECK (soort IN ('klant', 'leverancier', 'beide')),
  email             text,
  telefoon          text,
  website           text,
  kvk_nummer        text,
  btw_nummer        text,
  iban              text,
  land              text NOT NULL DEFAULT 'NL',
  betalingstermijn_dagen integer NOT NULL DEFAULT 30 CHECK (betalingstermijn_dagen >= 0),
  kredietlimiet     numeric(18,2),
  valuta            text NOT NULL DEFAULT 'EUR',
  notitie           text,
  tags              text[] NOT NULL DEFAULT '{}',
  -- Sleutel om dubbele relaties te herkennen: genormaliseerde naam.
  dedupe_sleutel    text NOT NULL,
  status            text NOT NULL DEFAULT 'actief' CHECK (status IN ('actief', 'gearchiveerd')),
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  gewijzigd_op      timestamptz NOT NULL DEFAULT now(),
  versie            integer NOT NULL DEFAULT 1,
  UNIQUE (administration_id, nummer)
);
CREATE INDEX idx_contact_naam ON contact (administration_id, naam);
CREATE INDEX idx_contact_dedupe ON contact (administration_id, dedupe_sleutel);

CREATE TABLE contact_address (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  contact_id    uuid NOT NULL REFERENCES contact(id) ON DELETE CASCADE,
  soort         text NOT NULL DEFAULT 'bezoek' CHECK (soort IN ('bezoek', 'post', 'factuur', 'levering')),
  adres         text,
  postcode      text,
  plaats        text,
  land          text NOT NULL DEFAULT 'NL'
);
CREATE INDEX idx_address_contact ON contact_address (administration_id, contact_id);

CREATE TABLE contact_person (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  contact_id    uuid NOT NULL REFERENCES contact(id) ON DELETE CASCADE,
  naam          text NOT NULL,
  functie       text,
  email         text,
  telefoon      text
);
CREATE INDEX idx_person_contact ON contact_person (administration_id, contact_id);

CREATE TABLE product (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  code              text,
  naam              text NOT NULL,
  soort             text NOT NULL DEFAULT 'dienst' CHECK (soort IN ('product', 'dienst')),
  omschrijving      text,
  eenheid           text NOT NULL DEFAULT 'stuk',
  verkoopprijs      numeric(18,2),
  inkoopprijs       numeric(18,2),
  tax_code_id       uuid REFERENCES tax_code(id) ON DELETE RESTRICT,
  ledger_account_id uuid REFERENCES ledger_account(id) ON DELETE RESTRICT,
  status            text NOT NULL DEFAULT 'actief' CHECK (status IN ('actief', 'gearchiveerd')),
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (administration_id, code)
);

-- ---------------------------------------------------------------------------
-- Documenten
-- ---------------------------------------------------------------------------

CREATE TABLE document (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  opslag_sleutel    text NOT NULL,
  bestandsnaam      text NOT NULL,
  mime              text NOT NULL,
  grootte           bigint NOT NULL CHECK (grootte >= 0),
  sha256            text NOT NULL,
  classificatie     text NOT NULL DEFAULT 'normaal' CHECK (classificatie IN ('normaal', 'gevoelig')),
  soort             text NOT NULL DEFAULT 'bijlage',
  bewaren_tot       date,
  legal_hold        boolean NOT NULL DEFAULT false,
  geupload_door     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  verwijderd_op     timestamptz,
  UNIQUE (administration_id, sha256, bestandsnaam)
);
CREATE INDEX idx_document_admin ON document (administration_id, aangemaakt_op DESC);

CREATE TABLE document_event (
  id            bigserial PRIMARY KEY,
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  document_id   uuid NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  op            timestamptz NOT NULL DEFAULT now(),
  actie         text NOT NULL,
  user_id       uuid REFERENCES app_user(id) ON DELETE SET NULL,
  details       jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_document_event ON document_event (administration_id, document_id, op DESC);

-- ---------------------------------------------------------------------------
-- Verkoop
-- ---------------------------------------------------------------------------

CREATE TABLE sales_invoice (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  contact_id        uuid NOT NULL REFERENCES contact(id) ON DELETE RESTRICT,
  soort             text NOT NULL DEFAULT 'factuur'
                      CHECK (soort IN ('offerte', 'factuur', 'creditnota', 'proforma')),
  documentnummer    text,
  status            text NOT NULL DEFAULT 'concept'
                      CHECK (status IN ('concept', 'definitief', 'verzonden', 'deels_betaald', 'betaald', 'vervallen', 'vervallen_offerte', 'geannuleerd')),
  factuurdatum      date NOT NULL,
  leverdatum        date,
  vervaldatum       date,
  referentie        text,
  notitie           text,
  valuta            text NOT NULL DEFAULT 'EUR',
  wisselkoers       numeric(18,8) NOT NULL DEFAULT 1,
  totaal_exclusief  numeric(18,2) NOT NULL DEFAULT 0,
  totaal_btw        numeric(18,2) NOT NULL DEFAULT 0,
  totaal_inclusief  numeric(18,2) NOT NULL DEFAULT 0,
  betaald_bedrag    numeric(18,2) NOT NULL DEFAULT 0,
  journal_entry_id  uuid REFERENCES journal_entry(id) ON DELETE RESTRICT,
  credits_invoice_id uuid REFERENCES sales_invoice(id) ON DELETE RESTRICT,
  pdf_document_id   uuid REFERENCES document(id) ON DELETE SET NULL,
  verzonden_op      timestamptz,
  verzonden_naar    text,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  aangemaakt_door   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  gewijzigd_op      timestamptz NOT NULL DEFAULT now(),
  versie            integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX idx_sales_nummer ON sales_invoice (administration_id, documentnummer)
  WHERE documentnummer IS NOT NULL;
CREATE INDEX idx_sales_contact ON sales_invoice (administration_id, contact_id, factuurdatum DESC);
CREATE INDEX idx_sales_status ON sales_invoice (administration_id, status, vervaldatum);

CREATE TABLE sales_invoice_line (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  invoice_id        uuid NOT NULL REFERENCES sales_invoice(id) ON DELETE CASCADE,
  regelnummer       integer NOT NULL,
  product_id        uuid REFERENCES product(id) ON DELETE SET NULL,
  omschrijving      text NOT NULL,
  aantal            numeric(18,6) NOT NULL DEFAULT 1,
  eenheid           text NOT NULL DEFAULT 'stuk',
  prijs             numeric(18,2) NOT NULL DEFAULT 0,
  korting           numeric(18,2) NOT NULL DEFAULT 0,
  tax_code_id       uuid NOT NULL REFERENCES tax_code(id) ON DELETE RESTRICT,
  ledger_account_id uuid NOT NULL REFERENCES ledger_account(id) ON DELETE RESTRICT,
  bedrag_exclusief  numeric(18,2) NOT NULL DEFAULT 0,
  bedrag_btw        numeric(18,2) NOT NULL DEFAULT 0,
  bedrag_inclusief  numeric(18,2) NOT NULL DEFAULT 0,
  UNIQUE (invoice_id, regelnummer)
);
CREATE INDEX idx_sales_line_invoice ON sales_invoice_line (administration_id, invoice_id);

-- ---------------------------------------------------------------------------
-- Inkoop
-- ---------------------------------------------------------------------------

CREATE TABLE purchase_invoice (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  contact_id        uuid NOT NULL REFERENCES contact(id) ON DELETE RESTRICT,
  soort             text NOT NULL DEFAULT 'factuur' CHECK (soort IN ('factuur', 'creditnota')),
  leveranciersnummer text,
  documentnummer    text,
  status            text NOT NULL DEFAULT 'concept'
                      CHECK (status IN ('concept', 'ter_goedkeuring', 'definitief', 'deels_betaald', 'betaald', 'afgekeurd')),
  factuurdatum      date NOT NULL,
  ontvangstdatum    date,
  vervaldatum       date,
  omschrijving      text,
  valuta            text NOT NULL DEFAULT 'EUR',
  wisselkoers       numeric(18,8) NOT NULL DEFAULT 1,
  totaal_exclusief  numeric(18,2) NOT NULL DEFAULT 0,
  totaal_btw        numeric(18,2) NOT NULL DEFAULT 0,
  totaal_inclusief  numeric(18,2) NOT NULL DEFAULT 0,
  betaald_bedrag    numeric(18,2) NOT NULL DEFAULT 0,
  journal_entry_id  uuid REFERENCES journal_entry(id) ON DELETE RESTRICT,
  document_id       uuid REFERENCES document(id) ON DELETE SET NULL,
  goedgekeurd_door  uuid REFERENCES app_user(id) ON DELETE SET NULL,
  goedgekeurd_op    timestamptz,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  aangemaakt_door   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  gewijzigd_op      timestamptz NOT NULL DEFAULT now(),
  versie            integer NOT NULL DEFAULT 1
);
-- Dubbele leveranciersfacturen worden hiermee onmogelijk.
CREATE UNIQUE INDEX idx_purchase_dubbel
  ON purchase_invoice (administration_id, contact_id, leveranciersnummer)
  WHERE leveranciersnummer IS NOT NULL;
CREATE INDEX idx_purchase_status ON purchase_invoice (administration_id, status, vervaldatum);

CREATE TABLE purchase_invoice_line (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  invoice_id        uuid NOT NULL REFERENCES purchase_invoice(id) ON DELETE CASCADE,
  regelnummer       integer NOT NULL,
  omschrijving      text NOT NULL,
  aantal            numeric(18,6) NOT NULL DEFAULT 1,
  prijs             numeric(18,2) NOT NULL DEFAULT 0,
  korting           numeric(18,2) NOT NULL DEFAULT 0,
  tax_code_id       uuid NOT NULL REFERENCES tax_code(id) ON DELETE RESTRICT,
  ledger_account_id uuid NOT NULL REFERENCES ledger_account(id) ON DELETE RESTRICT,
  cost_center_id    uuid,
  bedrag_exclusief  numeric(18,2) NOT NULL DEFAULT 0,
  bedrag_btw        numeric(18,2) NOT NULL DEFAULT 0,
  bedrag_inclusief  numeric(18,2) NOT NULL DEFAULT 0,
  UNIQUE (invoice_id, regelnummer)
);
CREATE INDEX idx_purchase_line_invoice ON purchase_invoice_line (administration_id, invoice_id);

-- ---------------------------------------------------------------------------
-- Bank
-- ---------------------------------------------------------------------------

CREATE TABLE bank_account (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  naam              text NOT NULL,
  iban              text,
  bic               text,
  valuta            text NOT NULL DEFAULT 'EUR',
  ledger_account_id uuid NOT NULL REFERENCES ledger_account(id) ON DELETE RESTRICT,
  journal_id        uuid REFERENCES journal(id) ON DELETE RESTRICT,
  soort             text NOT NULL DEFAULT 'bank'
                      CHECK (soort IN ('bank', 'spaar', 'creditcard', 'betaalprovider', 'kas')),
  provider          text,
  consent_tot       timestamptz,
  status            text NOT NULL DEFAULT 'actief' CHECK (status IN ('actief', 'gearchiveerd')),
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (administration_id, iban)
);

CREATE TABLE bank_statement (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  bank_account_id   uuid NOT NULL REFERENCES bank_account(id) ON DELETE RESTRICT,
  afschriftnummer   text,
  bron              text NOT NULL CHECK (bron IN ('csv', 'mt940', 'camt053', 'psd2', 'handmatig')),
  van_datum         date,
  tot_datum         date,
  beginsaldo        numeric(18,2),
  eindsaldo         numeric(18,2),
  bestandsnaam      text,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  aangemaakt_door   uuid REFERENCES app_user(id) ON DELETE SET NULL
);
CREATE INDEX idx_statement_account ON bank_statement (administration_id, bank_account_id, van_datum DESC);

CREATE TABLE bank_transaction (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  bank_account_id   uuid NOT NULL REFERENCES bank_account(id) ON DELETE RESTRICT,
  statement_id      uuid REFERENCES bank_statement(id) ON DELETE SET NULL,
  boekdatum         date NOT NULL,
  valutadatum       date,
  bedrag            numeric(18,2) NOT NULL,
  valuta            text NOT NULL DEFAULT 'EUR',
  tegenrekening     text,
  tegenpartij       text,
  omschrijving      text NOT NULL DEFAULT '',
  kenmerk           text,
  externe_id        text,
  -- Hash over de kenmerkende velden; voorkomt dat dezelfde regel twee keer
  -- binnenkomt bij een overlappende import.
  dedupe_hash       text NOT NULL,
  status            text NOT NULL DEFAULT 'nieuw'
                      CHECK (status IN ('nieuw', 'voorstel', 'geboekt', 'genegeerd')),
  journal_entry_id  uuid REFERENCES journal_entry(id) ON DELETE RESTRICT,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  versie            integer NOT NULL DEFAULT 1,
  UNIQUE (administration_id, bank_account_id, dedupe_hash)
);
CREATE INDEX idx_banktx_status ON bank_transaction (administration_id, status, boekdatum DESC);
CREATE INDEX idx_banktx_account ON bank_transaction (administration_id, bank_account_id, boekdatum);

CREATE TABLE bank_rule (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  naam              text NOT NULL,
  volgorde          integer NOT NULL DEFAULT 100,
  voorwaarden       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ledger_account_id uuid REFERENCES ledger_account(id) ON DELETE RESTRICT,
  tax_code_id       uuid REFERENCES tax_code(id) ON DELETE RESTRICT,
  contact_id        uuid REFERENCES contact(id) ON DELETE SET NULL,
  automatisch_boeken boolean NOT NULL DEFAULT false,
  actief            boolean NOT NULL DEFAULT true,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bankrule_admin ON bank_rule (administration_id, volgorde);

-- Koppeling tussen een banktransactie en een openstaande post. Meerdere
-- koppelingen per transactie maken deelbetalingen en verzamelbetalingen mogelijk.
CREATE TABLE payment_allocation (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id     uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  bank_transaction_id   uuid REFERENCES bank_transaction(id) ON DELETE CASCADE,
  sales_invoice_id      uuid REFERENCES sales_invoice(id) ON DELETE RESTRICT,
  purchase_invoice_id   uuid REFERENCES purchase_invoice(id) ON DELETE RESTRICT,
  journal_entry_id      uuid REFERENCES journal_entry(id) ON DELETE RESTRICT,
  bedrag                numeric(18,2) NOT NULL CHECK (bedrag <> 0),
  aangemaakt_op         timestamptz NOT NULL DEFAULT now(),
  aangemaakt_door       uuid REFERENCES app_user(id) ON DELETE SET NULL,
  CONSTRAINT een_factuur CHECK (
    (sales_invoice_id IS NOT NULL)::int + (purchase_invoice_id IS NOT NULL)::int = 1
  )
);
CREATE INDEX idx_alloc_sales ON payment_allocation (administration_id, sales_invoice_id);
CREATE INDEX idx_alloc_purchase ON payment_allocation (administration_id, purchase_invoice_id);
CREATE INDEX idx_alloc_tx ON payment_allocation (administration_id, bank_transaction_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {{APP_ROLE}};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {{APP_ROLE}};
REVOKE UPDATE, DELETE ON audit_event FROM {{APP_ROLE}};
