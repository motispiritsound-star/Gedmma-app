-- The test suite truncates its database between files, so it must never be the
-- development one. Created here so `docker compose up -d db` is enough.
CREATE DATABASE wonderbox_test OWNER wonderbox;
