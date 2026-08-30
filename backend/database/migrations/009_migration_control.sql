-- ============================================================
-- Migration 009: Tabela de controlo de migrations
-- Deve ser a primeira a ser criada no sistema de migrations
-- ============================================================
CREATE TABLE IF NOT EXISTS _migrations (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);
