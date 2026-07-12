-- Refonte gestion utilisateurs : présence (last_seen_at), historique des
-- réattributions advisor-client (audit) et demandes de bannissement.
-- Présent aussi dans db/init/00-init.sql pour les bases neuves, et appliqué
-- au démarrage par UsersManagementSchemaBootstrapService (déploiements Swarm
-- qui ne rejouent pas db/init).

-- Dernière présence constatée (mise à jour à la fermeture du dernier socket
-- et à la déconnexion). NULL = jamais connecté → on n'affiche rien.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NULL;

-- Audit des changements d'advisor : qui a réattribué quel client, de qui vers
-- qui, et quand. old_advisor_id NULL = première attribution.
CREATE TABLE IF NOT EXISTS advisor_client_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_advisor_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    new_advisor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_advisor_client_history_client
    ON advisor_client_history(client_id);

-- Demandes de bannissement : objet métier à part entière (le message de chat
-- n'est qu'un affichage ; les décisions s'appuient sur cet enregistrement).
CREATE TABLE IF NOT EXISTS ban_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advisor_requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_director_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    conversation_id uuid NULL REFERENCES conversations(id) ON DELETE SET NULL,
    message_id uuid NULL REFERENCES messages(id) ON DELETE SET NULL,
    decision_comment text NULL,
    processed_at timestamptz NULL,
    processed_by_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ban_requests_director_status
    ON ban_requests(assigned_director_id, status);
CREATE INDEX IF NOT EXISTS idx_ban_requests_conversation
    ON ban_requests(conversation_id);
