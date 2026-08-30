-- Migration 014: portfolio_url e avatar_url em users
-- Garante que as colunas existem (idempotente)
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url    VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio           TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality   VARCHAR(50) DEFAULT 'Angolano';
