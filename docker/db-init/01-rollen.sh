#!/bin/sh
# De applicatie verbindt met een rol zonder DDL-rechten en zonder BYPASSRLS.
# Migraties draaien met de eigenaarsrol. Zie docs/security.md.
#
# Dit script draait één keer, bij het aanmaken van een lege database. Het
# wachtwoord komt uit de omgeving, zodat er geen wachtwoord in de repository
# staat; buiten productie is er een zichtbare ontwikkelwaarde.
set -eu

WACHTWOORD="${GEDMMA_APP_WACHTWOORD:-gedmma_dev}"

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gedmma_app') THEN
    CREATE ROLE gedmma_app LOGIN;
  END IF;
END
\$\$;

ALTER ROLE gedmma_app WITH PASSWORD '${WACHTWOORD}';
GRANT USAGE ON SCHEMA public TO gedmma_app;
GRANT ALL ON SCHEMA public TO ${POSTGRES_USER};
SQL
