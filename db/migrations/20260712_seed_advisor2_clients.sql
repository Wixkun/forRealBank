-- Seed additionnel : un deuxième advisor (Antoine) et deux clients rattachés
-- (David / Emma), avec comptes bancaires, carte et compte investissement.
-- Idempotent : rejouable sur une base existante (init.sql n'est exécuté que
-- sur les bases neuves). Présent aussi dans db/init/00-init.sql (STEP 7-9 et
-- 15b).

INSERT INTO users (email, "passwordHash", first_name, last_name, email_verified, email_verified_at)
VALUES
    ('advisor2@forreal.bank', crypt('Advisor@123', gen_salt('bf')), 'Antoine', 'Advisor', true, now()),
    ('client3@forreal.bank',  crypt('Client@123',  gen_salt('bf')), 'David', 'Client', true, now()),
    ('client4@forreal.bank',  crypt('Client@123',  gen_salt('bf')), 'Emma',  'Client', true, now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ADVISOR'
WHERE u.email = 'advisor2@forreal.bank'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'CLIENT'
WHERE u.email IN ('client3@forreal.bank', 'client4@forreal.bank')
ON CONFLICT DO NOTHING;

INSERT INTO advisor_clients (advisor_id, client_id)
SELECT a.id, c.id
FROM users a CROSS JOIN users c
WHERE a.email = 'advisor2@forreal.bank'
  AND c.email IN ('client3@forreal.bank', 'client4@forreal.bank')
ON CONFLICT ON CONSTRAINT uq_advisor_client DO NOTHING;

DO $$
DECLARE
    v_client3_id  uuid;
    v_client4_id  uuid;
    v_checking_id uuid;
BEGIN
    SELECT id INTO v_client3_id FROM users WHERE email = 'client3@forreal.bank';
    SELECT id INTO v_client4_id FROM users WHERE email = 'client4@forreal.bank';

    -- ── Client3 (David) ──────────────────────────────────────────────────
    INSERT INTO accounts (id, user_id, name, account_type, balance, iban, account_number, interest_rate, opened_at)
    VALUES
        (gen_random_uuid(), v_client3_id, 'Compte Courant', 'checking', 3120.40,
            'FR76 2222 3333 4444 5555 6666 777', '****3341', NULL, '2023-09-05'),
        (gen_random_uuid(), v_client3_id, 'Compte Épargne', 'savings', 6800.00,
            'FR76 8888 7777 6666 5555 4444 333', '****9034', 2.50, '2023-10-12')
    ON CONFLICT (iban) DO NOTHING;

    SELECT id INTO v_checking_id FROM accounts WHERE iban = 'FR76 2222 3333 4444 5555 6666 777';
    IF v_checking_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM cards WHERE account_id = v_checking_id
    ) THEN
        INSERT INTO cards (account_id, type, last_four, expiry_date)
        VALUES (v_checking_id, 'virtual', '3341', now() + interval '3 years');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM investment_accounts WHERE user_id = v_client3_id) THEN
        INSERT INTO investment_accounts (id, user_id, name, cash_balance, total_value, total_gain_loss, opened_at)
        VALUES (gen_random_uuid(), v_client3_id, 'Compte Investissement', 2500.00, 4870.25, 320.25, '2024-01-18');
    END IF;

    -- ── Client4 (Emma) ───────────────────────────────────────────────────
    INSERT INTO accounts (id, user_id, name, account_type, balance, iban, account_number, interest_rate, opened_at)
    VALUES
        (gen_random_uuid(), v_client4_id, 'Compte Courant', 'checking', 7245.90,
            'FR76 9999 0000 1111 2222 3333 444', '****6712', NULL, '2022-06-30'),
        (gen_random_uuid(), v_client4_id, 'Compte Épargne', 'savings', 18450.00,
            'FR76 4444 5555 6666 7777 8888 999', '****2258', 2.50, '2022-07-15')
    ON CONFLICT (iban) DO NOTHING;

    SELECT id INTO v_checking_id FROM accounts WHERE iban = 'FR76 9999 0000 1111 2222 3333 444';
    IF v_checking_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM cards WHERE account_id = v_checking_id
    ) THEN
        INSERT INTO cards (account_id, type, last_four, expiry_date)
        VALUES (v_checking_id, 'virtual', '6712', now() + interval '3 years');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM investment_accounts WHERE user_id = v_client4_id) THEN
        INSERT INTO investment_accounts (id, user_id, name, cash_balance, total_value, total_gain_loss, opened_at)
        VALUES (gen_random_uuid(), v_client4_id, 'Compte Investissement', 5000.00, 21630.50, 1830.50, '2023-03-22');
    END IF;

END $$;
