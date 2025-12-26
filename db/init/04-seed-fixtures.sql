-- Seed fixtures for quick app testing
-- Requires roles (01-seed-roles.sql) and chat/feed schema (02-create-chat-schema.sql)
-- Also ensures pgcrypto for bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Users
-- Insert one advisor and one client with hashed passwords
INSERT INTO users (email, "passwordHash", first_name, last_name)
VALUES
  ('advisor1@forreal.bank', crypt('Advisor@123', gen_salt('bf')), 'Alice', 'Advisor'),
  ('client1@forreal.bank',  crypt('Client@123',  gen_salt('bf')), 'Bob',   'Client')
ON CONFLICT (email) DO NOTHING;

-- 2) Assign roles to users via user_roles
-- Relies on role names inserted by 01-seed-roles.sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'ADVISOR'
WHERE u.email = 'advisor1@forreal.bank'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'CLIENT'
WHERE u.email = 'client1@forreal.bank'
ON CONFLICT DO NOTHING;

-- 3) Link advisor <-> client
INSERT INTO advisor_clients (advisor_id, client_id)
SELECT a.id, c.id
FROM users a
JOIN users c ON TRUE
WHERE a.email = 'advisor1@forreal.bank' AND c.email = 'client1@forreal.bank'
ON CONFLICT ON CONSTRAINT uq_advisor_client DO NOTHING;

-- 4) Create a PRIVATE conversation for them
WITH conv AS (
  INSERT INTO conversations (type)
  VALUES ('PRIVATE')
  RETURNING id
)
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT conv.id, u.id
FROM conv
JOIN users u ON u.email IN ('advisor1@forreal.bank','client1@forreal.bank');

-- 5) Initial messages
WITH conv AS (
  SELECT c.id FROM conversations c ORDER BY created_at ASC LIMIT 1
),
advisor AS (
  SELECT id FROM users WHERE email = 'advisor1@forreal.bank'
),
client AS (
  SELECT id FROM users WHERE email = 'client1@forreal.bank'
)
INSERT INTO messages (conversation_id, sender_id, content)
SELECT (SELECT id FROM conv), (SELECT id FROM advisor), 'Bonjour, comment puis-je vous aider aujourd''hui ?'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM client),  'Bonjour, j''ai une question au sujet de mon compte.'
ON CONFLICT DO NOTHING;

-- 6) News / feed example
INSERT INTO news (author_id, title, content)
SELECT u.id, 'Mise à jour des fonctionnalités', 'Nous avons ajouté le chat en temps réel et des notifications personnalisées.'
FROM users u
WHERE u.email = 'advisor1@forreal.bank'
ON CONFLICT DO NOTHING;

-- 7) Notification example to the client
INSERT INTO notifications (user_id, title, content, type)
SELECT u.id, 'Bienvenue !', 'Votre compte a été configuré avec des données de démonstration.', 'WELCOME'
FROM users u
WHERE u.email = 'client1@forreal.bank'
ON CONFLICT DO NOTHING;
