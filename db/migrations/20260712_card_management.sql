-- Card controls for databases created before the card-management screen.
ALTER TABLE cards
    ADD COLUMN IF NOT EXISTS online_payments_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS contactless_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS international_payments_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS spending_limit decimal(10, 2) NOT NULL DEFAULT 2500.00,
    ADD COLUMN IF NOT EXISTS withdrawal_limit decimal(10, 2) NOT NULL DEFAULT 500.00;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cards_spending_limit_check') THEN
        ALTER TABLE cards ADD CONSTRAINT cards_spending_limit_check
            CHECK (spending_limit BETWEEN 100 AND 20000);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cards_withdrawal_limit_check') THEN
        ALTER TABLE cards ADD CONSTRAINT cards_withdrawal_limit_check
            CHECK (withdrawal_limit BETWEEN 20 AND 5000);
    END IF;
END $$;

INSERT INTO cards (account_id, type, last_four, expiry_date)
SELECT
    account.id,
    'virtual',
    COALESCE(NULLIF(right(regexp_replace(account.account_number, '[^0-9]', '', 'g'), 4), ''),
             lpad((floor(random() * 10000))::int::text, 4, '0')),
    now() + interval '3 years'
FROM accounts account
WHERE account.account_type = 'checking'
  AND NOT EXISTS (SELECT 1 FROM cards card WHERE card.account_id = account.id);
