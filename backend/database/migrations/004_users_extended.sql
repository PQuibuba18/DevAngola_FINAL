-- ============================================================
-- Migration 004: Campos estendidos de utilizadores
-- Adiciona role, badge, is_active, theme, language, identifier, quiz_expires_at
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role          VARCHAR(20)  DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge         VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_label   VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS identifier    VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme         VARCHAR(10)  DEFAULT 'light';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language      VARCHAR(10)  DEFAULT 'pt';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN      DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS quiz_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
