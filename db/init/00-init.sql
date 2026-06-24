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

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count int NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_until timestamptz NULL;

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

CREATE TABLE IF NOT EXISTS news (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
    user_id varchar NULL,
    title varchar(255) NOT NULL,
    content text NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'INFORMATION',
    archived_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_dismissals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL,
    news_id varchar NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_news_dismissal UNIQUE (user_id, news_id)
);

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

-- Investment cash movements (deposits / withdrawals to investment account)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_accounts_user_id ON investment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_positions_investment_account ON trading_positions(investment_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_investment_account ON trading_orders(investment_account_id);
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
-- STEP 6: Seed Users
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
-- STEP 7: Assign User Roles
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
-- STEP 8: Link Advisor <-> Clients
-- ============================================================================

INSERT INTO advisor_clients (advisor_id, client_id)
SELECT a.id, c.id
FROM users a CROSS JOIN users c
WHERE a.email = 'advisor1@forreal.bank'
  AND c.email IN ('client1@forreal.bank', 'client2@forreal.bank')
ON CONFLICT ON CONSTRAINT uq_advisor_client DO NOTHING;

-- ============================================================================
-- STEP 9: Create Conversations
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
-- STEP 10: Seed Messages
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
-- STEP 11: Seed News
-- ============================================================================

INSERT INTO news (author_id, user_id, title, content, status)
SELECT u.id, NULL, 'Connexion depuis un nouvel appareil',
    'Une connexion à votre compte a été détectée depuis un appareil inconnu. Si ce n''était pas vous, sécurisez immédiatement votre compte.',
    'SECURITY'
FROM users u WHERE u.email = 'director1@forreal.bank'
UNION ALL
SELECT u.id, NULL, 'Virement reçu avec succès',
    'Vous avez reçu un virement de 1 250,00 € sur votre compte principal. Le solde a été mis à jour.',
    'TRANSACTIONS'
FROM users u WHERE u.email = 'director1@forreal.bank'
UNION ALL
SELECT u.id, NULL, 'Prélèvement automatique programmé',
    'Un prélèvement de 89,99 € est prévu le 28 de ce mois pour votre abonnement. Vérifiez que votre solde est suffisant.',
    'PAYMENTS'
FROM users u WHERE u.email = 'director1@forreal.bank'
UNION ALL
SELECT u.id, NULL, 'Informations de profil mises à jour',
    'Les informations de votre compte ont été modifiées. Si vous n''êtes pas à l''origine de ce changement, contactez le support.',
    'ACCOUNT_UPDATES'
FROM users u WHERE u.email = 'director1@forreal.bank'
UNION ALL
SELECT u.id, NULL, 'Maintenance planifiée',
    'Une maintenance technique est prévue cette nuit de 2h à 4h. Certains services seront temporairement indisponibles.',
    'SYSTEM'
FROM users u WHERE u.email = 'director1@forreal.bank'
UNION ALL
SELECT u.id, NULL, 'Nouvelle réglementation bancaire',
    'À compter du 1er juillet, de nouvelles règles s''appliquent aux virements internationaux. Consultez notre guide pour en savoir plus.',
    'INFORMATION'
FROM users u WHERE u.email = 'director1@forreal.bank';

-- ============================================================================
-- STEP 12: Seed Notifications
-- ============================================================================

INSERT INTO notifications (user_id, title, content, type)
SELECT u.id, 'Bienvenue !', 'Votre compte a été configuré avec des données de démonstration.', 'WELCOME'
FROM users u WHERE u.email IN ('client1@forreal.bank', 'client2@forreal.bank')
UNION ALL
SELECT u.id, 'Nouveau message', 'Vous avez reçu un nouveau message de votre conseiller.', 'MESSAGE'
FROM users u WHERE u.email = 'client1@forreal.bank'
UNION ALL
SELECT u.id, 'Rappel', 'N''oubliez pas de vérifier votre portefeuille d''investissements.', 'REMINDER'
FROM users u WHERE u.email = 'client2@forreal.bank'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 13: Seed Banking Data (Client1)
-- ============================================================================

DO $$
DECLARE
    v_client1_id          uuid;
    v_checking_id         uuid;
    v_savings_id          uuid;
    v_investment_id       uuid;
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

    -- Card for checking account
    IF v_checking_id IS NOT NULL THEN
        INSERT INTO cards (account_id, type, last_four, expiry_date)
        VALUES (v_checking_id, 'virtual', '4789', now() + interval '3 years')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Checking transactions
    IF v_checking_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_checking_id, 'credit', 'Salaire',               3500.00,   5420.50, now() - interval '6 days'),
            (v_checking_id, 'debit',  'Carrefour',              -85.40,   1920.50, now() - interval '8 days'),
            (v_checking_id, 'debit',  'Netflix',                -13.99,   2005.90, now() - interval '11 days'),
            (v_checking_id, 'debit',  'Virement Épargne',      -500.00,   2019.89, now() - interval '14 days'),
            (v_checking_id, 'credit', 'Remboursement',           45.20,   2519.89, now() - interval '16 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Savings transactions
    IF v_savings_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_savings_id, 'transfer', 'Virement depuis Compte Courant', 500.00, 12350.00, now() - interval '14 days'),
            (v_savings_id, 'credit',   'Intérêts (2.50%)',                25.30, 11850.00, now() - interval '30 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Investment account
    INSERT INTO investment_accounts (id, user_id, name, cash_balance, total_value, total_gain_loss, opened_at)
    VALUES (gen_random_uuid(), v_client1_id, 'Compte Investissement', 10000.00, 98450.25, 13563.00, '2023-06-10')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_investment_id FROM investment_accounts WHERE user_id = v_client1_id LIMIT 1;

    -- Market assets
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

    -- Trading positions
    IF v_investment_id IS NOT NULL THEN
        INSERT INTO trading_positions (investment_account_id, asset_id, quantity, avg_purchase_price)
        SELECT v_investment_id, ma.id, pos.quantity, pos.avg_price
        FROM (VALUES
            ('AAPL', 50::decimal,   145.30::decimal),
            ('BTC',   0.5::decimal, 35000.00::decimal),
            ('MSFT', 30::decimal,   320.00::decimal),
            ('ETH',   5::decimal,   1800.00::decimal),
            ('SPY',  25::decimal,   410.00::decimal),
            ('TSLA', 15::decimal,   230.00::decimal),
            ('GOLD', 10::decimal,   1850.00::decimal),
            ('SOL', 100::decimal,    95.00::decimal)
        ) AS pos(symbol, quantity, avg_price)
        JOIN market_assets ma ON ma.symbol = pos.symbol
        ON CONFLICT (investment_account_id, asset_id) DO NOTHING;
    END IF;

END $$;

-- ============================================================================
-- STEP 14: Seed Banking Data (Client2)
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

    -- Accounts
    INSERT INTO accounts (id, user_id, name, account_type, balance, iban, account_number, interest_rate, opened_at)
    VALUES
        (gen_random_uuid(), v_client2_id, 'Compte Courant', 'checking', 8750.80,
            'FR76 5555 6666 7777 8888 9999 000', '****5623', NULL, '2022-11-20'),
        (gen_random_uuid(), v_client2_id, 'Compte Épargne', 'savings', 25600.00,
            'FR76 1111 2222 3333 4444 5555 666', '****7891', 2.75, '2023-02-10')
    ON CONFLICT (iban) DO NOTHING;

    SELECT id INTO v_checking_id FROM accounts WHERE iban = 'FR76 5555 6666 7777 8888 9999 000';
    SELECT id INTO v_savings_id  FROM accounts WHERE iban = 'FR76 1111 2222 3333 4444 5555 666';

    -- Card for checking account
    IF v_checking_id IS NOT NULL THEN
        INSERT INTO cards (account_id, type, last_four, expiry_date)
        VALUES (v_checking_id, 'virtual', '5623', now() + interval '3 years')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Checking transactions
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

    -- Savings transactions
    IF v_savings_id IS NOT NULL THEN
        INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
        VALUES
            (v_savings_id, 'transfer', 'Épargne mensuelle',  1000.00, 25600.00, now() - interval '5 days'),
            (v_savings_id, 'credit',   'Intérêts (2.75%)',     45.80, 24600.00, now() - interval '31 days'),
            (v_savings_id, 'transfer', 'Épargne mensuelle',  1000.00, 24554.20, now() - interval '35 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Investment account
    INSERT INTO investment_accounts (id, user_id, name, cash_balance, total_value, total_gain_loss, opened_at)
    VALUES (gen_random_uuid(), v_client2_id, 'Compte Investissement', 15000.00, 142350.75, 28420.50, '2022-08-15')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_investment_id FROM investment_accounts WHERE user_id = v_client2_id LIMIT 1;

    -- Trading positions
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
-- Users     : 4 (1 Director, 1 Advisor, 2 Clients) — passwords: {Role}@123
-- Accounts  : checking + savings par client (interest_rate 2.50% / 2.75% sur savings)
-- Cards     : 1 carte virtuelle par compte courant
-- Investment: 1 compte investissement par client avec 8 positions chacun
-- Assets    : BTC ETH SOL AAPL MSFT TSLA GOOGL AMZN SPY QQQ GOLD OIL
-- Client1   : Checking €5 420,50 | Savings €12 350,00 | Invest cash €10 000
-- Client2   : Checking €8 750,80 | Savings €25 600,00 | Invest cash €15 000
-- ============================================================================
