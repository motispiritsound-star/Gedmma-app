-- De applicatie verbindt met een rol zonder DDL-rechten en zonder BYPASSRLS.
-- Migraties draaien met de eigenaarsrol. Zie docs/security.md.
CREATE ROLE gedmma_app LOGIN PASSWORD 'gedmma_dev';
GRANT USAGE ON SCHEMA public TO gedmma_app;
GRANT ALL ON SCHEMA public TO gedmma_owner;
