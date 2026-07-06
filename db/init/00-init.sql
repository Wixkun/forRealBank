-- ============================================================================
-- ForRealBank - Complete Database Initialization
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- STEP 2: Create Core Tables
-- ============================================================================

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
    ban_reason text NULL,
    failed_login_count int NOT NULL DEFAULT 0,
    lock_until timestamptz NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- STEP 3: Create Chat & Feed Schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS advisor_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_advisor_client UNIQUE (advisor_id, client_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('PRIVATE','GROUP')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_user UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz NULL
);

-- Préférences de notifications par conversation et par utilisateur
-- muted = false                        → notifications activées
-- muted = true  AND muted_until IS NULL → désactivé définitivement
-- muted = true  AND muted_until > now() → désactivé temporairement
-- muted = true  AND muted_until <= now()→ expiré, traiter comme activé
CREATE TABLE IF NOT EXISTS conversation_notification_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    muted boolean NOT NULL DEFAULT false,
    muted_until timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conv_notif_settings UNIQUE (user_id, conversation_id)
);

-- État de lecture par utilisateur et par conversation
-- Permet de savoir jusqu'où l'utilisateur a lu dans une conversation
-- et de marquer comme lue la notification groupée associée
CREATE TABLE IF NOT EXISTS conversation_user_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    last_read_message_id uuid NULL REFERENCES messages(id) ON DELETE SET NULL,
    last_read_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conv_user_state UNIQUE (user_id, conversation_id)
);

-- News globales et ciblées
-- source  : MANUAL  = créée par DIRECTOR/ADVISOR via l'interface
--           AUTOMATIC = générée par le backend lors d'un événement métier
-- user_id : NULL       = news globale (visible par tous)
--           <uuid>     = news ciblée pour un seul utilisateur
CREATE TABLE IF NOT EXISTS news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    user_id varchar NULL,
    title varchar(255) NOT NULL,
    subtitle varchar(255) NULL,
    content text NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'INFORMATION'
        CHECK (status IN ('INFORMATION', 'SECURITY', 'TRANSACTION', 'PAYMENT', 'ACCOUNT', 'SYSTEM')),
    source varchar(20) NOT NULL DEFAULT 'MANUAL'
        CHECK (source IN ('MANUAL', 'AUTOMATIC')),
    is_active boolean NOT NULL DEFAULT true,
    image_url varchar NULL,
    -- Données structurées propres au type de news (ex. détail d'un virement)
    metadata jsonb NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Statut par utilisateur pour une news
CREATE TABLE IF NOT EXISTS user_news_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    news_id varchar NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'VISIBLE'
        CHECK (status IN ('VISIBLE', 'READ', 'ARCHIVED', 'DELETED')),
    read_at timestamptz NULL,
    archived_at timestamptz NULL,
    deleted_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_news_status UNIQUE (user_id, news_id)
);

-- Tables legacy conservées pour compatibilité
CREATE TABLE IF NOT EXISTS news_dismissals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    news_id varchar NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_news_dismissal UNIQUE (user_id, news_id)
);

CREATE TABLE IF NOT EXISTS news_user_archives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    news_id varchar NOT NULL,
    archived_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_news_user_archive UNIQUE (user_id, news_id)
);

-- Notifications utilisateur
-- Séparées des actualités (news) : courtes, actionnables, liées à un utilisateur précis
-- group_key              : permet de regrouper les notifications d'une même source
--                          ex. "conversation:uuid" pour les messages d'une conversation
-- oldest_unread_message_id : le plus vieux message non lu → point de départ du scroll
-- unread_count           : nombre de messages non lus dans ce groupe
-- is_read                : false = non lue, true = lue (redondant avec read_at pour les index)
-- target_type / target_id / target_url : lien vers l'entité cible
--
-- Enum NotificationType    : MESSAGE | TRANSACTION | SECURITY | SYSTEM | PAYMENT | ACCOUNT | NEWS
-- Enum NotificationTargetType : CONVERSATION | MESSAGE | ACCOUNT | TRANSACTION | PAYMENT | NEWS | URL
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    content text NOT NULL,
    type varchar(100) NOT NULL
        CHECK (type IN ('MESSAGE', 'TRANSACTION', 'SECURITY', 'SYSTEM', 'PAYMENT', 'ACCOUNT', 'NEWS')),
    target_type varchar(100) NULL
        CHECK (target_type IN ('CONVERSATION', 'MESSAGE', 'ACCOUNT', 'TRANSACTION', 'PAYMENT', 'NEWS', 'URL')),
    target_id varchar NULL,
    target_url text NULL,
    group_key varchar NULL,
    oldest_unread_message_id varchar NULL,
    unread_count int NOT NULL DEFAULT 1,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 4: Create Banking & Trading Schema
-- ============================================================================

-- Accounts (checking + savings)
CREATE TABLE IF NOT EXISTS accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    account_type varchar(20) NOT NULL CHECK (account_type IN ('checking', 'savings')),
    balance decimal(15, 2) NOT NULL DEFAULT 0,
    iban varchar(34) NOT NULL UNIQUE,
    account_number varchar(20) NOT NULL,
    interest_rate decimal(5, 2) NULL,
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
    opened_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Investment accounts (bourse)
CREATE TABLE IF NOT EXISTS investment_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    cash_balance decimal(15, 2) NOT NULL DEFAULT 0,
    total_value decimal(15, 2) NOT NULL DEFAULT 0,
    total_gain_loss decimal(15, 2) NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
    opened_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cards (linked to checking/savings accounts)
CREATE TABLE IF NOT EXISTS cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type varchar(10) NOT NULL CHECK (type IN ('virtual', 'physical')),
    last_four varchar(4) NOT NULL,
    expiry_date timestamptz NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bank transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type varchar(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'payment')),
    description text NOT NULL,
    amount decimal(15, 2) NOT NULL,
    balance_after decimal(15, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Investment cash movements
CREATE TABLE IF NOT EXISTS investment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_account_id uuid NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
    type varchar(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    description text NOT NULL,
    amount decimal(15, 2) NOT NULL,
    cash_balance_after decimal(15, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Market assets
CREATE TABLE IF NOT EXISTS market_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol varchar(20) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    asset_type varchar(20) NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'etf', 'commodity')),
    is_tradable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trading positions
CREATE TABLE IF NOT EXISTS trading_positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_account_id uuid NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
    quantity decimal(20, 8) NOT NULL,
    avg_purchase_price decimal(15, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_position UNIQUE (investment_account_id, asset_id)
);

-- Trading orders
CREATE TABLE IF NOT EXISTS trading_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_account_id uuid NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
    order_type varchar(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
    side varchar(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity decimal(20, 8) NOT NULL,
    price decimal(15, 2) NULL,
    status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'failed')),
    executed_price decimal(15, 2) NULL,
    executed_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 5: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id                 ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_accounts_user_id      ON investment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id                 ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id     ON bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at     ON bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_positions_investment     ON trading_positions(investment_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_investment        ON trading_orders(investment_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status            ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_market_assets_symbol             ON market_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_market_assets_type               ON market_assets(asset_type);

-- Feed indexes
CREATE INDEX IF NOT EXISTS idx_news_is_active                   ON news(is_active);
CREATE INDEX IF NOT EXISTS idx_news_user_id                     ON news(user_id);
CREATE INDEX IF NOT EXISTS idx_news_created_at                  ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_news_status_user_news       ON user_news_status(user_id, news_id);
CREATE INDEX IF NOT EXISTS idx_user_news_status_news            ON user_news_status(news_id);

-- Notification indexes
-- idx_notifications_user_unread : requête principale (cloche → badge non lues)
-- idx_notifications_group_key   : lookup de notification groupée (MESSAGE par conversation)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id            ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread        ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_group_key          ON notifications(user_id, type, group_key) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_updated_at         ON notifications(user_id, updated_at DESC);

-- Chat notification indexes
CREATE INDEX IF NOT EXISTS idx_conv_notif_settings_user         ON conversation_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_notif_settings_conv         ON conversation_notification_settings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_user_state_user             ON conversation_user_state(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_user_state_conv             ON conversation_user_state(conversation_id);

-- ============================================================================
-- STEP 6: Seed Roles
-- ============================================================================

DELETE FROM roles WHERE name IS NULL;

INSERT INTO roles (name) VALUES
    ('CLIENT'),
    ('ADVISOR'),
    ('DIRECTOR'),
    ('ADMIN')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 7: Seed Users
-- ============================================================================
-- 1 Director, 1 Advisor, 2 Clients
-- Passwords: Director@123 / Advisor@123 / Client@123

INSERT INTO users (email, "passwordHash", first_name, last_name)
VALUES
    ('director1@forreal.bank', crypt('Director@123', gen_salt('bf')), 'Diane', 'Director'),
    ('advisor1@forreal.bank',  crypt('Advisor@123',  gen_salt('bf')), 'Alice', 'Advisor'),
    ('client1@forreal.bank',   crypt('Client@123',   gen_salt('bf')), 'Bob',   'Client'),
    ('client2@forreal.bank',   crypt('Client@123',   gen_salt('bf')), 'Charlie', 'Client')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 8: Assign User Roles
-- ============================================================================

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'DIRECTOR'
WHERE u.email = 'director1@forreal.bank'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ADVISOR'
WHERE u.email = 'advisor1@forreal.bank'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'CLIENT'
WHERE u.email IN ('client1@forreal.bank', 'client2@forreal.bank')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 9: Link Advisor <-> Clients
-- ============================================================================

INSERT INTO advisor_clients (advisor_id, client_id)
SELECT a.id, c.id
FROM users a CROSS JOIN users c
WHERE a.email = 'advisor1@forreal.bank'
  AND c.email IN ('client1@forreal.bank', 'client2@forreal.bank')
ON CONFLICT ON CONSTRAINT uq_advisor_client DO NOTHING;

-- ============================================================================
-- STEP 10: Create Conversations
-- ============================================================================

WITH conv AS (
    INSERT INTO conversations (type) VALUES ('PRIVATE') RETURNING id
)
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT conv.id, u.id FROM conv CROSS JOIN users u
WHERE u.email IN ('advisor1@forreal.bank', 'client1@forreal.bank');

WITH conv AS (
    INSERT INTO conversations (type) VALUES ('GROUP') RETURNING id
)
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT conv.id, u.id FROM conv CROSS JOIN users u
WHERE u.email IN ('director1@forreal.bank', 'advisor1@forreal.bank', 'client1@forreal.bank', 'client2@forreal.bank');

-- ============================================================================
-- STEP 11: Seed Messages
-- ============================================================================

WITH conv AS (
    SELECT c.id FROM conversations c WHERE c.type = 'PRIVATE' ORDER BY c.created_at ASC LIMIT 1
),
advisor AS (SELECT id FROM users WHERE email = 'advisor1@forreal.bank'),
client  AS (SELECT id FROM users WHERE email = 'client1@forreal.bank')
INSERT INTO messages (conversation_id, sender_id, content)
SELECT (SELECT id FROM conv), (SELECT id FROM advisor), 'Bonjour Bob, comment puis-je vous aider aujourd''hui ?'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM client),  'Bonjour Alice, j''ai une question au sujet de mon compte.'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM advisor), 'Bien sûr, je suis à votre écoute.'
ON CONFLICT DO NOTHING;

WITH conv AS (
    SELECT c.id FROM conversations c WHERE c.type = 'GROUP' ORDER BY c.created_at ASC LIMIT 1
),
director AS (SELECT id FROM users WHERE email = 'director1@forreal.bank'),
advisor  AS (SELECT id FROM users WHERE email = 'advisor1@forreal.bank'),
client1  AS (SELECT id FROM users WHERE email = 'client1@forreal.bank'),
client2  AS (SELECT id FROM users WHERE email = 'client2@forreal.bank')
INSERT INTO messages (conversation_id, sender_id, content)
SELECT (SELECT id FROM conv), (SELECT id FROM director), 'Bienvenue à tous dans cette discussion de groupe !'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM advisor),  'Merci Diane. Je suis disponible pour répondre à vos questions.'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM client1),  'Bonjour à tous !'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM client2),  'Content de faire partie de ce groupe.'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 12: Seed News
-- ============================================================================

DO $$
DECLARE
    v_director_id uuid;
    v_advisor_id  uuid;
    v_client1_id  uuid;
    v_client2_id  uuid;
BEGIN
    SELECT id INTO v_director_id FROM users WHERE email = 'director1@forreal.bank';
    SELECT id INTO v_advisor_id  FROM users WHERE email = 'advisor1@forreal.bank';
    SELECT id INTO v_client1_id  FROM users WHERE email = 'client1@forreal.bank';
    SELECT id INTO v_client2_id  FROM users WHERE email = 'client2@forreal.bank';

    -- ── News MANUELLES globales (source = MANUAL, user_id = NULL) ──────────

    INSERT INTO news (author_id, user_id, title, content, status, source, is_active) VALUES
        (v_director_id, NULL,
            'Maintenance planifiée',
            'Une maintenance technique est prévue cette nuit de 2h à 4h. Certains services seront temporairement indisponibles.',
            'SYSTEM', 'MANUAL', true),
        (v_director_id, NULL,
            'Nouvelle réglementation bancaire',
            'À compter du 1er juillet, de nouvelles règles s''appliquent aux virements internationaux. Consultez notre guide pour en savoir plus.',
            'INFORMATION', 'MANUAL', true),
        (v_advisor_id, NULL,
            'Nouvelle fonctionnalité disponible',
            'Vous pouvez désormais programmer vos virements récurrents directement depuis votre espace client.',
            'INFORMATION', 'MANUAL', true);

    -- ── News AUTOMATIQUES ciblées client1 ─────────────────────────────────

    INSERT INTO news (author_id, user_id, title, subtitle, content, status, source, is_active, metadata) VALUES
        (NULL, v_client1_id::varchar,
            'Virement reçu avec succès',
            '+ 1 250,00 € de Sophie Martin',
            'Vous avez reçu un virement de 1 250,00 € sur votre compte principal. Le solde a été mis à jour.',
            'TRANSACTION', 'AUTOMATIC', true,
            '{"kind":"TRANSFER","direction":"IN","status":"COMPLETED","amount":1250,"currency":"EUR","fees":0,"transactionId":"TRX-20240520-143245-8F7A2C1D","sourceAccountName":"Compte Courant","sourceIban":"FR76 1234 5678 9012 3456 7890 123","destinationAccountName":"Compte Courant","destinationIban":"FR14 2004 1010 0505 0001 3M02 606","beneficiaryName":"Sophie Martin","description":"Loyer mai 2024"}'::jsonb);

    INSERT INTO news (author_id, user_id, title, content, status, source, is_active) VALUES
        (NULL, v_client1_id::varchar,
            'Connexion depuis un nouvel appareil',
            'Une connexion à votre compte a été détectée depuis un appareil inconnu. Si ce n''était pas vous, sécurisez immédiatement votre compte.',
            'SECURITY', 'AUTOMATIC', true),
        (NULL, v_client1_id::varchar,
            'Prélèvement automatique programmé',
            'Un prélèvement de 89,99 € est prévu le 28 de ce mois pour votre abonnement. Vérifiez que votre solde est suffisant.',
            'PAYMENT', 'AUTOMATIC', true),
        (NULL, v_client1_id::varchar,
            'Informations de profil mises à jour',
            'Les informations de votre compte ont été modifiées. Si vous n''êtes pas à l''origine de ce changement, contactez le support.',
            'ACCOUNT', 'AUTOMATIC', true);

    -- ── News AUTOMATIQUES ciblées client2 ────────────────────────────────

    INSERT INTO news (author_id, user_id, title, subtitle, content, status, source, is_active, metadata) VALUES
        (NULL, v_client2_id::varchar,
            'Virement effectué',
            '- 500,00 € vers Compte Épargne',
            'Votre virement de 500,00 € vers votre compte épargne a été exécuté avec succès.',
            'TRANSACTION', 'AUTOMATIC', true,
            '{"kind":"TRANSFER","direction":"OUT","status":"COMPLETED","amount":500,"currency":"EUR","fees":0,"transactionId":"TRX-20240612-091812-2C4E8A1B","sourceAccountName":"Compte Courant","sourceIban":"FR76 9876 5432 1098 7654 3210 987","destinationAccountName":"Compte Épargne","destinationIban":"FR76 5555 4444 3333 2222 1111 000","description":"Épargne mensuelle"}'::jsonb);

    INSERT INTO news (author_id, user_id, title, content, status, source, is_active) VALUES
        (NULL, v_client2_id::varchar,
            'Intérêts crédités',
            'Des intérêts de 45,80 € ont été crédités sur votre compte épargne (taux annuel 2,75 %).',
            'ACCOUNT', 'AUTOMATIC', true);

END $$;

-- ============================================================================
-- STEP 13: Seed Notifications
-- ============================================================================

DO $$
DECLARE
    v_client1_id  uuid;
    v_client2_id  uuid;
    v_advisor_id  uuid;
    v_director_id uuid;
    v_conv_private_id uuid;
    v_conv_group_id   uuid;
    v_news_maintenance_id uuid;
BEGIN
    SELECT id INTO v_client1_id  FROM users WHERE email = 'client1@forreal.bank';
    SELECT id INTO v_client2_id  FROM users WHERE email = 'client2@forreal.bank';
    SELECT id INTO v_advisor_id  FROM users WHERE email = 'advisor1@forreal.bank';
    SELECT id INTO v_director_id FROM users WHERE email = 'director1@forreal.bank';

    SELECT id INTO v_conv_private_id
    FROM conversations WHERE type = 'PRIVATE' ORDER BY created_at ASC LIMIT 1;

    SELECT id INTO v_conv_group_id
    FROM conversations WHERE type = 'GROUP' ORDER BY created_at ASC LIMIT 1;

    SELECT id INTO v_news_maintenance_id
    FROM news WHERE title = 'Maintenance planifiée' LIMIT 1;

    -- Notification de bienvenue (SYSTEM) pour les clients
    INSERT INTO notifications (user_id, title, content, type, target_type, target_url, is_read)
    VALUES
        (v_client1_id, 'Bienvenue sur ForRealBank',
            'Votre compte a été configuré avec des données de démonstration.',
            'SYSTEM', 'URL', '/dashboard', false),
        (v_client2_id, 'Bienvenue sur ForRealBank',
            'Votre compte a été configuré avec des données de démonstration.',
            'SYSTEM', 'URL', '/dashboard', false);

    -- Notification de message groupée (non lue) pour client1 dans la conversation privée
    IF v_conv_private_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id, title, content, type,
            target_type, target_id, target_url,
            group_key, unread_count, is_read
        ) VALUES (
            v_client1_id,
            '1 nouveau message',
            'Vous avez reçu un nouveau message',
            'MESSAGE',
            'CONVERSATION',
            v_conv_private_id::varchar,
            '/messages/conversations/' || v_conv_private_id,
            'conversation:' || v_conv_private_id,
            1,
            false
        );
    END IF;

    -- Notification de sécurité (SECURITY) pour client1
    INSERT INTO notifications (user_id, title, content, type, target_type, target_url, is_read)
    VALUES (
        v_client1_id,
        'Connexion depuis un nouvel appareil',
        'Une connexion a été détectée depuis un nouvel appareil. Vérifiez votre activité.',
        'SECURITY', 'URL', '/settings/security', false
    );

    -- Notification de transaction (TRANSACTION) pour client1
    INSERT INTO notifications (user_id, title, content, type, target_type, target_url, is_read)
    VALUES (
        v_client1_id,
        'Virement reçu',
        'Vous avez reçu un virement de 1 250,00 €.',
        'TRANSACTION', 'ACCOUNT', '/accounts', false
    );

    -- Notification liée à la news de maintenance pour clients et advisor (déjà lue)
    IF v_news_maintenance_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id, title, content, type,
            target_type, target_id, target_url, is_read, read_at
        )
        SELECT
            u.id,
            'Maintenance planifiée ce soir',
            'Une maintenance est prévue de 2h à 4h. Certains services seront indisponibles.',
            'NEWS',
            'NEWS',
            v_news_maintenance_id::varchar,
            '/dashboard?newsId=' || v_news_maintenance_id,
            true,
            now() - interval '1 hour'
        FROM users u
        WHERE u.email IN ('client1@forreal.bank', 'client2@forreal.bank', 'advisor1@forreal.bank');
    END IF;

END $$;

-- ============================================================================
-- STEP 14: Seed Banking Data (Client1)
-- ============================================================================

DO $$
DECLARE
    v_client1_id    uuid;
    v_checking_id   uuid;
    v_savings_id    uuid;
    v_investment_id uuid;
BEGIN
    SELECT id INTO v_client1_id FROM users WHERE email = 'client1@forreal.bank';
    IF v_client1_id IS NULL THEN RAISE EXCEPTION 'Client1 user not found'; END IF;

    -- Accounts
    INSERT INTO accounts (id, user_id, name, account_type, balance, iban, account_number, interest_rate, opened_at)
    VALUES
        (gen_random_uuid(), v_client1_id, 'Compte Courant', 'checking', 5420.50,
            'FR76 1234 5678 9012 3456 7890 123', '****4789', NULL, '2023-01-15'),
        (gen_random_uuid(), v_client1_id, 'Compte Épargne', 'savings', 12350.00,
            'FR76 9876 5432 1098 7654 3210 987', '****8923', 2.50, '2023-03-22')
    ON CONFLICT (iban) DO NOTHING;

    SELECT id INTO v_checking_id FROM accounts WHERE iban = 'FR76 1234 5678 9012 3456 7890 123';
    SELECT id INTO v_savings_id  FROM accounts WHERE iban = 'FR76 9876 5432 1098 7654 3210 987';

    IF v_checking_id IS NOT NULL THEN
        INSERT INTO cards (account_id, type, last_four, expiry_date)
        VALUES (v_checking_id, 'virtual', '4789', now() + interval '3 years')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_checking_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_checking_id, 'credit', 'Salaire',          3500.00,  5420.50, now() - interval '6 days'),
            (v_checking_id, 'debit',  'Carrefour',          -85.40,  1920.50, now() - interval '8 days'),
            (v_checking_id, 'debit',  'Netflix',            -13.99,  2005.90, now() - interval '11 days'),
            (v_checking_id, 'debit',  'Virement Épargne',  -500.00,  2019.89, now() - interval '14 days'),
            (v_checking_id, 'credit', 'Remboursement',       45.20,  2519.89, now() - interval '16 days')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_savings_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_savings_id, 'transfer', 'Virement depuis Compte Courant', 500.00, 12350.00, now() - interval '14 days'),
            (v_savings_id, 'credit',   'Intérêts (2.50%)',                25.30, 11850.00, now() - interval '30 days')
        ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO investment_accounts (id, user_id, name, cash_balance, total_value, total_gain_loss, opened_at)
    VALUES (gen_random_uuid(), v_client1_id, 'Compte Investissement', 10000.00, 98450.25, 13563.00, '2023-06-10')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_investment_id FROM investment_accounts WHERE user_id = v_client1_id LIMIT 1;

    INSERT INTO market_assets (symbol, name, asset_type) VALUES
        ('BTC',   'Bitcoin',               'crypto'),
        ('ETH',   'Ethereum',              'crypto'),
        ('SOL',   'Solana',                'crypto'),
        ('AAPL',  'Apple Inc.',            'stock'),
        ('MSFT',  'Microsoft Corporation', 'stock'),
        ('TSLA',  'Tesla Inc.',            'stock'),
        ('GOOGL', 'Alphabet Inc.',         'stock'),
        ('AMZN',  'Amazon.com Inc.',       'stock'),
        ('SPY',   'SPDR S&P 500 ETF',      'etf'),
        ('QQQ',   'Invesco QQQ Trust',     'etf'),
        ('GOLD',  'Gold Futures',          'commodity'),
        ('OIL',   'Crude Oil',             'commodity')
    ON CONFLICT (symbol) DO NOTHING;

    IF v_investment_id IS NOT NULL THEN
        INSERT INTO trading_positions (investment_account_id, asset_id, quantity, avg_purchase_price)
        SELECT v_investment_id, ma.id, pos.quantity, pos.avg_price
        FROM (VALUES
            ('AAPL',  50::decimal,   145.30::decimal),
            ('BTC',    0.5::decimal, 35000.00::decimal),
            ('MSFT',  30::decimal,   320.00::decimal),
            ('ETH',    5::decimal,   1800.00::decimal),
            ('SPY',   25::decimal,   410.00::decimal),
            ('TSLA',  15::decimal,   230.00::decimal),
            ('GOLD',  10::decimal,   1850.00::decimal),
            ('SOL',  100::decimal,    95.00::decimal)
        ) AS pos(symbol, quantity, avg_price)
        JOIN market_assets ma ON ma.symbol = pos.symbol
        ON CONFLICT (investment_account_id, asset_id) DO NOTHING;
    END IF;

END $$;

-- ============================================================================
-- STEP 15: Seed Banking Data (Client2)
-- ============================================================================

DO $$
DECLARE
    v_client2_id    uuid;
    v_checking_id   uuid;
    v_savings_id    uuid;
    v_investment_id uuid;
BEGIN
    SELECT id INTO v_client2_id FROM users WHERE email = 'client2@forreal.bank';
    IF v_client2_id IS NULL THEN RAISE EXCEPTION 'Client2 user not found'; END IF;

    INSERT INTO accounts (id, user_id, name, account_type, balance, iban, account_number, interest_rate, opened_at)
    VALUES
        (gen_random_uuid(), v_client2_id, 'Compte Courant', 'checking', 8750.80,
            'FR76 5555 6666 7777 8888 9999 000', '****5623', NULL, '2022-11-20'),
        (gen_random_uuid(), v_client2_id, 'Compte Épargne', 'savings', 25600.00,
            'FR76 1111 2222 3333 4444 5555 666', '****7891', 2.75, '2023-02-10')
    ON CONFLICT (iban) DO NOTHING;

    SELECT id INTO v_checking_id FROM accounts WHERE iban = 'FR76 5555 6666 7777 8888 9999 000';
    SELECT id INTO v_savings_id  FROM accounts WHERE iban = 'FR76 1111 2222 3333 4444 5555 666';

    IF v_checking_id IS NOT NULL THEN
        INSERT INTO cards (account_id, type, last_four, expiry_date)
        VALUES (v_checking_id, 'virtual', '5623', now() + interval '3 years')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_checking_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_checking_id, 'credit', 'Salaire',   4200.00, 8750.80, now() - interval '5 days'),
            (v_checking_id, 'debit',  'Loyer',     -1200.00, 4550.80, now() - interval '7 days'),
            (v_checking_id, 'debit',  'EDF',        -120.50, 5750.80, now() - interval '10 days'),
            (v_checking_id, 'debit',  'Courses',    -156.30, 5871.30, now() - interval '12 days'),
            (v_checking_id, 'credit', 'Virement',   500.00,  6027.60, now() - interval '15 days')
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_savings_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_savings_id, 'transfer', 'Épargne mensuelle',  1000.00, 25600.00, now() - interval '5 days'),
            (v_savings_id, 'credit',   'Intérêts (2.75%)',     45.80, 24600.00, now() - interval '31 days'),
            (v_savings_id, 'transfer', 'Épargne mensuelle',  1000.00, 24554.20, now() - interval '35 days')
        ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO investment_accounts (id, user_id, name, cash_balance, total_value, total_gain_loss, opened_at)
    VALUES (gen_random_uuid(), v_client2_id, 'Compte Investissement', 15000.00, 142350.75, 28420.50, '2022-08-15')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_investment_id FROM investment_accounts WHERE user_id = v_client2_id LIMIT 1;

    IF v_investment_id IS NOT NULL THEN
        INSERT INTO trading_positions (investment_account_id, asset_id, quantity, avg_purchase_price)
        SELECT v_investment_id, ma.id, pos.quantity, pos.avg_price
        FROM (VALUES
            ('GOOGL', 40::decimal,  2150.00::decimal),
            ('ETH',    8::decimal,  1650.00::decimal),
            ('AMZN',  25::decimal,  3100.00::decimal),
            ('BTC',    0.8::decimal, 32000.00::decimal),
            ('QQQ',   50::decimal,   380.00::decimal),
            ('SOL',  200::decimal,    85.00::decimal),
            ('MSFT',  45::decimal,   310.00::decimal),
            ('OIL',   15::decimal,    75.00::decimal)
        ) AS pos(symbol, quantity, avg_price)
        JOIN market_assets ma ON ma.symbol = pos.symbol
        ON CONFLICT (investment_account_id, asset_id) DO NOTHING;
    END IF;

END $$;

-- ============================================================================
-- Initialization Complete
-- ============================================================================
-- Users      : 4 (1 Director, 1 Advisor, 2 Clients) — passwords: {Role}@123
-- Roles      : CLIENT / ADVISOR / DIRECTOR / ADMIN
-- Accounts   : checking + savings par client
-- Cards      : 1 carte virtuelle par compte courant
-- Investment : 1 compte investissement par client avec 8 positions chacun
-- Assets     : BTC ETH SOL AAPL MSFT TSLA GOOGL AMZN SPY QQQ GOLD OIL
-- News       : 3 globales MANUAL (DIRECTOR/ADVISOR) + 4 ciblées client1 + 2 ciblées client2
-- Client1    : Checking €5 420,50 | Savings €12 350,00 | Invest cash €10 000
-- Client2    : Checking €8 750,80 | Savings €25 600,00 | Invest cash €15 000
-- Notifications:
--   client1  : bienvenue, message non lu (conv privée), sécurité, transaction, maintenance (lue)
--   client2  : bienvenue, maintenance (lue)
--   advisor  : maintenance (lue)
-- Tables notifications : conversation_notification_settings, conversation_user_state
-- ============================================================================
