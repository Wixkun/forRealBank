-- Core users schema and user_roles join table
-- Ensures pgcrypto for gen_random_uuid and crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    "passwordHash" text NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz NULL,
    is_banned boolean NOT NULL DEFAULT false,
    banned_at timestamptz NULL,
    ban_reason text NULL
);

