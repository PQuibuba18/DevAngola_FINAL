-- ================================================================
-- DevAngola — Migração 004: Vagas de Emprego
-- Executar no Neon SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS job_posts (
  id             SERIAL PRIMARY KEY,
  company_name   VARCHAR(100)  NOT NULL,
  title          VARCHAR(200)  NOT NULL,
  description    TEXT          NOT NULL,
  level_required VARCHAR(20)   NOT NULL CHECK (level_required IN ('iniciante','junior','pleno','senior','qualquer')),
  location       VARCHAR(100)  NOT NULL DEFAULT 'Luanda',
  type           VARCHAR(20)   NOT NULL DEFAULT 'full-time' CHECK (type IN ('full-time','part-time','freelance','remoto')),
  contact_email  VARCHAR(150)  NOT NULL,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  posted_by      INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_active   ON job_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_level    ON job_posts(level_required);
CREATE INDEX IF NOT EXISTS idx_jobs_created  ON job_posts(created_at DESC);
