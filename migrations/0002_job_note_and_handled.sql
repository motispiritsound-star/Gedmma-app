-- What a customer actually needs, and what has already been dealt with.
--
-- The first version of the list only asked who somebody was and where. That is
-- enough to tell them the platform has opened, and not enough to send anybody
-- a painter: matching needs to know the trade, and the operator's page needs to
-- know which requests are still waiting for an answer.
--
-- Applied with:  npx wrangler d1 migrations apply buurklus --remote

ALTER TABLE signups ADD COLUMN job_note TEXT;
ALTER TABLE signups ADD COLUMN handled_at TEXT;

-- The page opens on the requests nobody has answered yet, so that is the
-- lookup that has to stay quick as the list grows.
CREATE INDEX IF NOT EXISTS signups_open_idx ON signups (role, handled_at, created_at);
