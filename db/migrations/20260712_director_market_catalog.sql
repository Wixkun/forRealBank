-- Une valeur n'est visible et négociable qu'après proposition explicite par
-- un directeur. Les anciennes valeurs de seed ne sont pas assimilées à un
-- choix métier : le directeur doit les activer depuis son écran Trading.
ALTER TABLE market_assets
    ADD COLUMN IF NOT EXISTS proposed_by_director_id uuid NULL REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE market_assets
    ADD COLUMN IF NOT EXISTS proposed_at timestamptz NULL;

UPDATE market_assets
SET is_tradable = false
WHERE proposed_at IS NULL;
