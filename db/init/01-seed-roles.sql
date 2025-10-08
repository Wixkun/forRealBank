CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS roles (
                                     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
    );

DELETE FROM roles WHERE name IS NULL;

INSERT INTO roles (name) VALUES
                             ('CLIENT'), ('ADVISOR'), ('DIRECTOR'), ('ADMIN')
    ON CONFLICT (name) DO NOTHING;
