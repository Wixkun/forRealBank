-- Masquage d'une conversation PAR utilisateur (jamais global à la conversation) :
-- hidden_at NULL      → conversation visible dans la liste de l'utilisateur
-- hidden_at NOT NULL  → masquée pour CET utilisateur uniquement (historique intact)
-- Un nouveau message dans la conversation remet hidden_at à NULL pour tous les
-- participants (la conversation réapparaît, non-lus et mute inchangés).
-- Présent aussi dans db/init/00-init.sql pour les bases neuves.
ALTER TABLE conversation_user_state
    ADD COLUMN IF NOT EXISTS hidden_at timestamptz NULL;
