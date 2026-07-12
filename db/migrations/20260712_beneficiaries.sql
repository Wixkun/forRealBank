-- Bénéficiaires de virement enregistrés par un utilisateur (IBAN normalisé :
-- majuscules, sans espaces). Unicité par (user_id, iban).
-- Idempotent : rejouable sans effet sur une base déjà à jour.
CREATE TABLE IF NOT EXISTS beneficiaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label varchar(100) NOT NULL,
    iban varchar(34) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, iban)
);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id);
