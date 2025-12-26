-- Chat & Feed schema
-- Requires pgcrypto (enabled in 01-seed-roles.sql) for gen_random_uuid()

-- 1) Advisor <-> Client relation
CREATE TABLE IF NOT EXISTS advisor_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_advisor_client UNIQUE (advisor_id, client_id)
);

-- 2) Conversations (PRIVATE | GROUP)
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('PRIVATE','GROUP')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Conversation participants (always via this table)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_user UNIQUE (conversation_id, user_id)
);

-- 4) Messages (WebSocket)
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz NULL
);

-- 5) News / Feed (SSE)
CREATE TABLE IF NOT EXISTS news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    title varchar(255) NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Personalized notifications (SSE)
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    content text NOT NULL,
    type varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz NULL
);
