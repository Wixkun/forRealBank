-- Seed banking and trading data
-- Requires users and 05-create-banking-schema.sql

-- Get user IDs
DO $$
DECLARE
    v_client1_id uuid;
    v_advisor1_id uuid;
    v_checking_account_id uuid;
    v_savings_account_id uuid;
    v_brokerage_account_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO v_client1_id FROM users WHERE email = 'client1@forreal.bank';
    SELECT id INTO v_advisor1_id FROM users WHERE email = 'advisor1@forreal.bank';

    IF v_client1_id IS NULL THEN
        RAISE EXCEPTION 'Client user not found';
    END IF;

    -- 1) Create bank accounts for client
    INSERT INTO bank_accounts (id, user_id, name, account_type, balance, iban, account_number, opened_at)
    VALUES
        (gen_random_uuid(), v_client1_id, 'Compte Courant', 'checking', 5420.50, 'FR76 1234 5678 9012 3456 7890 123', '****4789', '2023-01-15'),
        (gen_random_uuid(), v_client1_id, 'Compte Épargne', 'savings', 12350.00, 'FR76 9876 5432 1098 7654 3210 987', '****8923', '2023-03-22')
    ON CONFLICT (iban) DO NOTHING;

    -- Get account IDs
    SELECT id INTO v_checking_account_id FROM bank_accounts WHERE iban = 'FR76 1234 5678 9012 3456 7890 123';
    SELECT id INTO v_savings_account_id FROM bank_accounts WHERE iban = 'FR76 9876 5432 1098 7654 3210 987';

    -- 2) Add transactions for checking account
    INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
    VALUES
        (v_checking_account_id, 'credit', 'Salaire', 3500.00, 5420.50, now() - interval '6 days'),
        (v_checking_account_id, 'debit', 'Carrefour', -85.40, 1920.50, now() - interval '8 days'),
        (v_checking_account_id, 'debit', 'Netflix', -13.99, 2005.90, now() - interval '11 days'),
        (v_checking_account_id, 'debit', 'Virement Épargne', -500.00, 2019.89, now() - interval '14 days'),
        (v_checking_account_id, 'credit', 'Remboursement', 45.20, 2519.89, now() - interval '16 days')
    ON CONFLICT DO NOTHING;

    -- 3) Add transactions for savings account
    INSERT INTO bank_transactions (account_id, type, description, amount, balance_after, created_at)
    VALUES
        (v_savings_account_id, 'transfer', 'Virement depuis Compte Courant', 500.00, 12350.00, now() - interval '14 days'),
        (v_savings_account_id, 'credit', 'Intérêts', 25.30, 11850.00, now() - interval '30 days')
    ON CONFLICT DO NOTHING;

    -- 4) Create brokerage account for client
    INSERT INTO brokerage_accounts (id, user_id, name, balance, total_value, total_gain_loss, opened_at)
    VALUES
        (gen_random_uuid(), v_client1_id, 'Compte Trading', 10000.00, 98450.25, 13563.00, '2023-06-10')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_brokerage_account_id FROM brokerage_accounts WHERE user_id = v_client1_id LIMIT 1;

    -- 5) Seed market assets (metadata only, prices from external API)
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

    -- 6) Add trading positions for client (current prices will be fetched from external API)
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

    -- 7) Brokerage account totals will be calculated dynamically on frontend

END $$;
