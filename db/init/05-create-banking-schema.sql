-- Banking & Trading schema
-- Requires users table from 00-create-users.sql

-- 1) Bank accounts (checking, savings)
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

-- 2) Brokerage accounts (for trading)
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

-- 3) Bank transactions (for checking/savings accounts)
CREATE TABLE IF NOT EXISTS bank_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    type varchar(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'payment')),
    description text NOT NULL,
    amount decimal(15, 2) NOT NULL,
    balance_after decimal(15, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Market assets (stocks, crypto, ETF, commodities) - Metadata only, prices from external API
CREATE TABLE IF NOT EXISTS market_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol varchar(20) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    asset_type varchar(20) NOT NULL CHECK (asset_type IN ('stock', 'crypto', 'etf', 'commodity')),
    is_tradable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Trading positions (user's holdings) - Current price and gains calculated in real-time on frontend
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

-- 6) Trading orders (buy/sell orders)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_brokerage_accounts_user_id ON brokerage_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_positions_brokerage_account ON trading_positions(brokerage_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_brokerage_account ON trading_orders(brokerage_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_market_assets_symbol ON market_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_market_assets_type ON market_assets(asset_type);
