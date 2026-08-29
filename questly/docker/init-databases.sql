-- Separate databases for the unit/integration suite and the end-to-end suite,
-- so a failing test run can never touch development data.
CREATE DATABASE questly_test OWNER questly;
CREATE DATABASE questly_e2e OWNER questly;
