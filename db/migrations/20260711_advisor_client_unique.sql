-- Un client n'a qu'UN conseiller attitré : l'attribution automatique à
-- l'inscription et findAdvisorOf() supposent cette unicité. La contrainte
-- existante (uq_advisor_client) n'interdit que le doublon de la même paire.
-- Présent aussi dans db/init/00-init.sql pour les bases neuves.

-- Dédoublonnage préalable : on conserve le lien le plus ancien par client.
DELETE FROM advisor_clients a
USING advisor_clients b
WHERE a.client_id = b.client_id
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));

CREATE UNIQUE INDEX IF NOT EXISTS uq_advisor_clients_client ON advisor_clients(client_id);
