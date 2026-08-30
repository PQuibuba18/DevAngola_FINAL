-- Migration 013: Verificação de Identidade
-- Armazena apenas o resultado mínimo. O documento é eliminado após revisão.
-- Referência à secção J do documento técnico de arquitectura.
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified            BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50);

CREATE TABLE IF NOT EXISTS verification_requests (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  document_ref  VARCHAR(500), -- referência ao ficheiro no storage (apagado após aprovação)
  reviewed_by   INTEGER REFERENCES users(id),
  reviewed_at   TIMESTAMP,
  reject_reason TEXT,
  submitted_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verif_user   ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verif_status ON verification_requests(status);
