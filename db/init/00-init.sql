-- ============================================================================
-- ForRealBank - Complete Database Initialization
-- ============================================================================
-- This file consolidates all initialization steps in correct dependency order
-- Execute this file once to set up the complete database schema and seed data

-- ============================================================================
-- STEP 1: Enable Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- STEP 2: Create Core Tables
-- ============================================================================

-- Users table
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

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
);

-- User-Roles join table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- STEP 3: Create Chat & Feed Schema
-- ============================================================================

-- Advisor <-> Client relation
CREATE TABLE IF NOT EXISTS advisor_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_advisor_client UNIQUE (advisor_id, client_id)
);

-- Conversations (PRIVATE | GROUP)
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('PRIVATE','GROUP')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_user UNIQUE (conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz NULL
);

-- News / Feed
CREATE TABLE IF NOT EXISTS news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    title varchar(255) NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(255) NOT NULL,
    content text NOT NULL,
    type varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz NULL
);

-- ============================================================================
-- STEP 4: Create Banking & Trading Schema
-- ============================================================================

-- Bank accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    account_type varchar(20) NOT NULL CHECK (account_type IN ('checking', 'savings')),
    balance decimal(15, 2) NOT NULL DEFAULT 0,
    iban varchar(34) NOT NULL UNIQUE,
    account_number varchar(20) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
    opened_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Brokerage accounts
CREATE TABLE IF NOT EXISTS brokerage_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    balance decimal(15, 2) NOT NULL DEFAULT 0,
    total_value decimal(15, 2) NOT NULL DEFAULT 0,
    total_gain_loss decimal(15, 2) NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
    opened_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bank transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    type varchar(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'payment')),
    description text NOT NULL,
    amount decimal(15, 2) NOT NULL,
    balance_after decimal(15, 2) NOT NULL,
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
    brokerage_account_id uuid NOT NULL REFERENCES brokerage_accounts(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
    quantity decimal(20, 8) NOT NULL,
    avg_purchase_price decimal(15, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_position UNIQUE (brokerage_account_id, asset_id)
);

-- Trading orders
CREATE TABLE IF NOT EXISTS trading_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brokerage_account_id uuid NOT NULL REFERENCES brokerage_accounts(id) ON DELETE CASCADE,
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_brokerage_accounts_user_id ON brokerage_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_positions_brokerage_account ON trading_positions(brokerage_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_brokerage_account ON trading_orders(brokerage_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_market_assets_symbol ON market_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_market_assets_type ON market_assets(asset_type);

-- ============================================================================
-- STEP 5: Seed Roles
-- ============================================================================

DELETE FROM roles WHERE name IS NULL;

INSERT INTO roles (name) VALUES
    ('CLIENT'), 
    ('ADVISOR'), 
    ('DIRECTOR'), 
    ('ADMIN')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 6: Seed Users - Complete Scenario
-- ============================================================================
-- 1 Director, 1 Advisor, 2 Clients
-- All passwords follow format: Role@123

INSERT INTO users (email, "passwordHash", first_name, last_name)
VALUES
    ('director1@forreal.bank', crypt('Director@123', gen_salt('bf')), 'Diane', 'Director'),
    ('advisor1@forreal.bank', crypt('Advisor@123', gen_salt('bf')), 'Alice', 'Advisor'),
    ('client1@forreal.bank',  crypt('Client@123',  gen_salt('bf')), 'Bob', 'Client'),
    ('client2@forreal.bank',  crypt('Client@123',  gen_salt('bf')), 'Charlie', 'Client')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 7: Assign User Roles
-- ============================================================================

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = 'DIRECTOR'
WHERE u.email = 'director1@forreal.bank'
ON CONFLICT DO NOTHING;

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
WHERE u.email IN ('client1@forreal.bank', 'client2@forreal.bank')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 8: Link Advisor <-> Clients
-- ============================================================================

INSERT INTO advisor_clients (advisor_id, client_id)
SELECT a.id, c.id
FROM users a
CROSS JOIN users c
WHERE a.email = 'advisor1@forreal.bank' 
  AND c.email IN ('client1@forreal.bank', 'client2@forreal.bank')
ON CONFLICT ON CONSTRAINT uq_advisor_client DO NOTHING;

-- ============================================================================
-- STEP 9: Create Conversations
-- ============================================================================

-- 9.1: PRIVATE conversation (Advisor1 <-> Client1)
WITH conv AS (
    INSERT INTO conversations (type)
    VALUES ('PRIVATE')
    RETURNING id
)
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT conv.id, u.id
FROM conv
CROSS JOIN users u
WHERE u.email IN ('advisor1@forreal.bank', 'client1@forreal.bank');

-- 9.2: GROUP conversation (Director + Advisor + Both Clients)
WITH conv AS (
    INSERT INTO conversations (type)
    VALUES ('GROUP')
    RETURNING id
)
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT conv.id, u.id
FROM conv
CROSS JOIN users u
WHERE u.email IN ('director1@forreal.bank', 'advisor1@forreal.bank', 'client1@forreal.bank', 'client2@forreal.bank');

-- ============================================================================
-- STEP 10: Seed Messages
-- ============================================================================

-- 10.1: Messages in PRIVATE conversation
WITH conv AS (
    SELECT c.id 
    FROM conversations c 
    WHERE c.type = 'PRIVATE' 
    ORDER BY c.created_at ASC 
    LIMIT 1
),
advisor AS (
    SELECT id FROM users WHERE email = 'advisor1@forreal.bank'
),
client AS (
    SELECT id FROM users WHERE email = 'client1@forreal.bank'
)
INSERT INTO messages (conversation_id, sender_id, content)
SELECT (SELECT id FROM conv), (SELECT id FROM advisor), 'Bonjour Bob, comment puis-je vous aider aujourd''hui ?'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM client), 'Bonjour Alice, j''ai une question au sujet de mon compte.'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM advisor), 'Bien sûr, je suis à votre écoute.'
ON CONFLICT DO NOTHING;

-- 10.2: Messages in GROUP conversation
WITH conv AS (
    SELECT c.id 
    FROM conversations c 
    WHERE c.type = 'GROUP' 
    ORDER BY c.created_at ASC 
    LIMIT 1
),
director AS (
    SELECT id FROM users WHERE email = 'director1@forreal.bank'
),
advisor AS (
    SELECT id FROM users WHERE email = 'advisor1@forreal.bank'
),
client1 AS (
    SELECT id FROM users WHERE email = 'client1@forreal.bank'
),
client2 AS (
    SELECT id FROM users WHERE email = 'client2@forreal.bank'
)
INSERT INTO messages (conversation_id, sender_id, content)
SELECT (SELECT id FROM conv), (SELECT id FROM director), 'Bienvenue à tous dans cette discussion de groupe !'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM advisor), 'Merci Diane. Je suis disponible pour répondre à vos questions.'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM client1), 'Bonjour à tous !'
UNION ALL
SELECT (SELECT id FROM conv), (SELECT id FROM client2), 'Content de faire partie de ce groupe.'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 11: Seed News
-- ============================================================================

INSERT INTO news (author_id, title, content)
SELECT u.id, 'Mise à jour des fonctionnalités', 'Nous avons ajouté le chat en temps réel et des notifications personnalisées.'
FROM users u
WHERE u.email = 'director1@forreal.bank'
UNION ALL
SELECT u.id, 'Nouveaux services disponibles', 'Découvrez nos nouveaux produits d''investissement disponibles dès maintenant.'
FROM users u
WHERE u.email = 'advisor1@forreal.bank'
UNION ALL
SELECT u.id, 'Maintenance prévue', 'Une maintenance système est prévue ce week-end de 2h à 5h du matin.'
FROM users u
WHERE u.email = 'director1@forreal.bank'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 12: Seed Notifications
-- ============================================================================

INSERT INTO notifications (user_id, title, content, type)
SELECT u.id, 'Bienvenue !', 'Votre compte a été configuré avec des données de démonstration.', 'WELCOME'
FROM users u
WHERE u.email IN ('client1@forreal.bank', 'client2@forreal.bank')
UNION ALL
SELECT u.id, 'Nouveau message', 'Vous avez reçu un nouveau message de votre conseiller.', 'MESSAGE'
FROM users u
WHERE u.email = 'client1@forreal.bank'
UNION ALL
SELECT u.id, 'Rappel', 'N''oubliez pas de vérifier votre portefeuille d''investissements.', 'REMINDER'
FROM users u
WHERE u.email = 'client2@forreal.bank'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 13: Seed Banking Data (Client1)
-- ============================================================================

DO $$
DECLARE
    v_client1_id uuid;
    v_checking_account_id uuid;
    v_savings_account_id uuid;
    v_brokerage_account_id uuid;
BEGIN
    -- Get client1 ID
    SELECT id INTO v_client1_id FROM users WHERE email = 'client1@forreal.bank';

    IF v_client1_id IS NULL THEN
        RAISE EXCEPTION 'Client1 user not found';
    END IF;

    -- Create bank accounts
    INSERT INTO bank_accounts (id, user_id, name, account_type, balance, iban, account_number, opened_at)
    VALUES
        (gen_random_uuid(), v_client1_id, 'Compte Courant', 'checking', 5420.50, 'FR76 1234 5678 9012 3456 7890 123', '****4789', '2023-01-15'),
        (gen_random_uuid(), v_client1_id, 'Compte Épargne', 'savings', 12350.00, 'FR76 9876 5432 1098 7654 3210 987', '****8923', '2023-03-22')
    ON CONFLICT (iban) DO NOTHING;

    -- Get account IDs
    SELECT id INTO v_checking_account_id FROM bank_accounts WHERE iban = 'FR76 1234 5678 9012 3456 7890 123';
    SELECT id INTO v_savings_account_id FROM bank_accounts WHERE iban = 'FR76 9876 5432 1098 7654 3210 987';

    -- Add checking account transactions
    IF v_checking_account_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_checking_account_id, 'credit', 'Salaire', 3500.00, 5420.50, now() - interval '6 days'),
            (v_checking_account_id, 'debit', 'Carrefour', -85.40, 1920.50, now() - interval '8 days'),
            (v_checking_account_id, 'debit', 'Netflix', -13.99, 2005.90, now() - interval '11 days'),
            (v_checking_account_id, 'debit', 'Virement Épargne', -500.00, 2019.89, now() - interval '14 days'),
            (v_checking_account_id, 'credit', 'Remboursement', 45.20, 2519.89, now() - interval '16 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Add savings account transactions
    IF v_savings_account_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_savings_account_id, 'transfer', 'Virement depuis Compte Courant', 500.00, 12350.00, now() - interval '14 days'),
            (v_savings_account_id, 'credit', 'Intérêts', 25.30, 11850.00, now() - interval '30 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Create brokerage account
    INSERT INTO brokerage_accounts (id, user_id, name, balance, total_value, total_gain_loss, opened_at)
    VALUES
        (gen_random_uuid(), v_client1_id, 'Compte Trading', 10000.00, 98450.25, 13563.00, '2023-06-10')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_brokerage_account_id FROM brokerage_accounts WHERE user_id = v_client1_id LIMIT 1;

    -- Seed market assets
    INSERT INTO market_assets (symbol, name, asset_type)
    VALUES
        -- Crypto
        ('BTC', 'Bitcoin', 'crypto'),
        ('ETH', 'Ethereum', 'crypto'),
        ('SOL', 'Solana', 'crypto'),
        -- Stocks
        ('AAPL', 'Apple Inc.', 'stock'),
        ('MSFT', 'Microsoft Corporation', 'stock'),
        ('TSLA', 'Tesla Inc.', 'stock'),
        ('GOOGL', 'Alphabet Inc.', 'stock'),
        ('AMZN', 'Amazon.com Inc.', 'stock'),
        -- ETF
        ('SPY', 'SPDR S&P 500 ETF', 'etf'),
        ('QQQ', 'Invesco QQQ Trust', 'etf'),
        -- Commodities
        ('GOLD', 'Gold Futures', 'commodity'),
        ('OIL', 'Crude Oil', 'commodity')
    ON CONFLICT (symbol) DO NOTHING;

    -- Add trading positions
    IF v_brokerage_account_id IS NOT NULL THEN
        INSERT INTO trading_positions (brokerage_account_id, asset_id, quantity, avg_purchase_price)
        SELECT
            v_brokerage_account_id,
            ma.id,
            pos.quantity,
            pos.avg_price
        FROM (VALUES
            ('AAPL', 50::decimal, 145.30::decimal),
            ('BTC', 0.5::decimal, 35000.00::decimal),
            ('MSFT', 30::decimal, 320.00::decimal),
            ('ETH', 5::decimal, 1800.00::decimal),
            ('SPY', 25::decimal, 410.00::decimal),
            ('TSLA', 15::decimal, 230.00::decimal),
            ('GOLD', 10::decimal, 1850.00::decimal),
            ('SOL', 100::decimal, 95.00::decimal)
        ) AS pos(symbol, quantity, avg_price)
        JOIN market_assets ma ON ma.symbol = pos.symbol
        ON CONFLICT (brokerage_account_id, asset_id) DO NOTHING;
    END IF;

END $$;

-- ============================================================================
-- STEP 14: Seed Banking Data (Client2)
-- ============================================================================

DO $$
DECLARE
    v_client2_id uuid;
    v_checking_account_id uuid;
    v_savings_account_id uuid;
    v_brokerage_account_id uuid;
BEGIN
    -- Get client2 ID
    SELECT id INTO v_client2_id FROM users WHERE email = 'client2@forreal.bank';

    IF v_client2_id IS NULL THEN
        RAISE EXCEPTION 'Client2 user not found';
    END IF;

    -- Create bank accounts with different balances
    INSERT INTO bank_accounts (id, user_id, name, account_type, balance, iban, account_number, opened_at)
    VALUES
        (gen_random_uuid(), v_client2_id, 'Compte Courant', 'checking', 8750.80, 'FR76 5555 6666 7777 8888 9999 000', '****5623', '2022-11-20'),
        (gen_random_uuid(), v_client2_id, 'Compte Épargne', 'savings', 25600.00, 'FR76 1111 2222 3333 4444 5555 666', '****7891', '2023-02-10')
    ON CONFLICT (iban) DO NOTHING;

    -- Get account IDs
    SELECT id INTO v_checking_account_id FROM bank_accounts WHERE iban = 'FR76 5555 6666 7777 8888 9999 000';
    SELECT id INTO v_savings_account_id FROM bank_accounts WHERE iban = 'FR76 1111 2222 3333 4444 5555 666';

    -- Add checking account transactions
    IF v_checking_account_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_checking_account_id, 'credit', 'Salaire', 4200.00, 8750.80, now() - interval '5 days'),
            (v_checking_account_id, 'debit', 'Loyer', -1200.00, 4550.80, now() - interval '7 days'),
            (v_checking_account_id, 'debit', 'EDF', -120.50, 5750.80, now() - interval '10 days'),
            (v_checking_account_id, 'debit', 'Courses', -156.30, 5871.30, now() - interval '12 days'),
            (v_checking_account_id, 'credit', 'Virement', 500.00, 6027.60, now() - interval '15 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Add savings account transactions
    IF v_savings_account_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_savings_account_id, 'transfer', 'Épargne mensuelle', 1000.00, 25600.00, now() - interval '5 days'),
            (v_savings_account_id, 'credit', 'Intérêts', 45.80, 24600.00, now() - interval '31 days'),
            (v_savings_account_id, 'transfer', 'Épargne mensuelle', 1000.00, 24554.20, now() - interval '35 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Create brokerage account with different values
    INSERT INTO brokerage_accounts (id, user_id, name, balance, total_value, total_gain_loss, opened_at)
    VALUES
        (gen_random_uuid(), v_client2_id, 'Compte Trading', 15000.00, 142350.75, 28420.50, '2022-08-15')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_brokerage_account_id FROM brokerage_accounts WHERE user_id = v_client2_id LIMIT 1;

    -- Add different trading positions
    IF v_brokerage_account_id IS NOT NULL THEN
        INSERT INTO trading_positions (brokerage_account_id, asset_id, quantity, avg_purchase_price)
        SELECT
            v_brokerage_account_id,
            ma.id,
            pos.quantity,
            pos.avg_price
        FROM (VALUES
            ('GOOGL', 40::decimal, 2150.00::decimal),
            ('ETH', 8::decimal, 1650.00::decimal),
            ('AMZN', 25::decimal, 3100.00::decimal),
            ('BTC', 0.8::decimal, 32000.00::decimal),
            ('QQQ', 50::decimal, 380.00::decimal),
            ('SOL', 200::decimal, 85.00::decimal),
            ('MSFT', 45::decimal, 310.00::decimal),
            ('OIL', 15::decimal, 75.00::decimal)
        ) AS pos(symbol, quantity, avg_price)
        JOIN market_assets ma ON ma.symbol = pos.symbol
        ON CONFLICT (brokerage_account_id, asset_id) DO NOTHING;
    END IF;

END $$;

-- ============================================================================
-- Initialization Complete
-- ============================================================================
-- Summary:
-- - 4 users: 1 Director, 1 Advisor, 2 Clients
-- - Credentials: {role}@123 (e.g., Director@123, Advisor@123, Client@123)
-- - 2 conversations: 1 PRIVATE (advisor1<->client1), 1 GROUP (all users)
-- - Sample messages in both conversations
-- - 3 news articles
-- - Multiple notifications
-- - Banking accounts for both clients with different balances:
--   * Client1: Checking €5,420.50, Savings €12,350.00, Trading €10,000 (8 positions)
--   * Client2: Checking €8,750.80, Savings €25,600.00, Trading €15,000 (8 positions)
-- - Market assets seeded (crypto, stocks, ETF, commodities)
-- ============================================================================
