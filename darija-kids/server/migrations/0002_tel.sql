-- De trechter, in totalen.
--
-- Eén rij per gebeurtenis per dag per taal per platform per versie, en een
-- teller erop. Geen gebruiker, geen toestel, geen sessie, geen ip -- er is
-- niets in deze tafel waarmee een rij aan een persoon vastzit, en dat is niet
-- een eigenschap maar het ontwerp. Zie `src/engine/tellen.ts` voor waarom, en
-- `growth-audit/08-metrics-experiments.md` voor wat dat onmogelijk maakt: een
-- trechter per persoon volgen.
--
-- Dezelfde vorm als `mailteller` en `opening` uit 0001: een samengestelde
-- sleutel en `ON CONFLICT ... DO UPDATE SET aantal = aantal + 1`.
--
-- `dag` is tekst in de vorm 2026-11-18, zoals `opening` dat ook doet, en komt
-- van het toestel -- dus in de tijdzone van de lezer en niet in UTC. Dat is
-- met opzet: de vraag is op welke dag iemand de app opendeed, niet op welk
-- moment in Greenwich.
CREATE TABLE IF NOT EXISTS teller (
  naam     TEXT    NOT NULL,
  dag      TEXT    NOT NULL,
  taal     TEXT    NOT NULL,
  platform TEXT    NOT NULL,
  versie   TEXT    NOT NULL,
  aantal   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (naam, dag, taal, platform, versie)
);

-- Voor het overzicht per dag, dat `npm run cijfers` opvraagt: dat leest op dag
-- en niet op naam, en zonder deze index is dat een volledige tafelscan zodra
-- er een paar maanden in staan.
CREATE INDEX IF NOT EXISTS teller_dag ON teller (dag);
