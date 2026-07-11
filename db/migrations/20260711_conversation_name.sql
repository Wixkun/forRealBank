-- Nom personnalisé des conversations de groupe (NULL pour les privées).
-- Présent aussi dans db/init/00-init.sql pour les bases neuves.
ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS name varchar(120) NULL;
