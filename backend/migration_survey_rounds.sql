-- Migration: survey "rounds" support
-- Run this once against your existing Postgres database (e.g.
--   psql "$DATABASE_URL" -f migration_survey_rounds.sql
-- ) to add the columns/table the updated survey feature needs.
--
-- If you'd rather use Flask-Migrate instead, run:
--   flask db init      (only if backend/migrations doesn't exist yet)
--   flask db migrate -m "survey rounds"
--   flask db upgrade
-- and skip this file — Alembic will generate the same changes automatically.

BEGIN;

-- 1. New singleton table that tracks which "round" of the survey is live.
CREATE TABLE IF NOT EXISTS survey_settings (
    id SERIAL PRIMARY KEY,
    current_version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed the single settings row if it doesn't exist yet.
INSERT INTO survey_settings (current_version, updated_at)
SELECT 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM survey_settings);

-- 2. Tag every existing response as belonging to round 1 (the round they
--    were actually submitted under), then make the column required.
ALTER TABLE survey_responses
    ADD COLUMN IF NOT EXISTS survey_version INTEGER;

UPDATE survey_responses SET survey_version = 1 WHERE survey_version IS NULL;

ALTER TABLE survey_responses
    ALTER COLUMN survey_version SET DEFAULT 1,
    ALTER COLUMN survey_version SET NOT NULL;

COMMIT;
