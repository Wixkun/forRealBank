-- Table d'idempotence des virements (protection double-soumission / retry).
-- Présente aussi dans db/init/00-init.sql pour les bases neuves ; cette
-- migration la crée sur les bases existantes.
CREATE TABLE IF NOT EXISTS transfer_idempotency_keys (
    key text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
);
