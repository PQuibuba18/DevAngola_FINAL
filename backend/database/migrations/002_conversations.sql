-- ============================================================
-- Migration 002: Conversas e Mensagens
-- Resolve o conflito entre schema.sql, schema_v4.sql e 001_dm_recipient.sql
--
-- Situação encontrada:
--   schema.sql:            conversations com CHECK (user_a < user_b)
--   schema_v4.sql:         conversations com UNIQUE (LEAST, GREATEST) — conflito
--   001_dm_recipient.sql:  reescreve conversas + adiciona recipient_id
--
-- Esta migration é a fonte de verdade.
-- Usa LEAST/GREATEST para o par único (mais robusto que CHECK user_a < user_b).
-- recipient_id é mantido por compatibilidade com messageModel.js existente.
-- ============================================================

-- Conversas: um par de utilizadores tem uma única conversa
CREATE TABLE IF NOT EXISTS conversations (
  id         SERIAL PRIMARY KEY,
  user_a     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Garante unicidade do par independentemente da ordem de inserção
-- Se a tabela já existe com outra constraint, esta instrução é idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_conv_unique_pair'
  ) THEN
    -- Normaliza pares existentes antes de criar o índice único
    UPDATE conversations
    SET user_a = LEAST(user_a, user_b),
        user_b = GREATEST(user_a, user_b)
    WHERE user_a > user_b;

    CREATE UNIQUE INDEX idx_conv_unique_pair
      ON conversations (LEAST(user_a, user_b), GREATEST(user_a, user_b));
  END IF;
END $$;

-- Remove constraint CHECK antiga que pode conflituar
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_a_user_b_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_ordered_pair;

-- Mensagens
CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT    NOT NULL,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- recipient_id: adiciona se não existir (idempotente)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Preenche recipient_id em mensagens existentes que o têm NULL
UPDATE messages m
SET recipient_id = CASE
  WHEN m.sender_id = c.user_a THEN c.user_b
  ELSE c.user_a
END
FROM conversations c
WHERE c.id = m.conversation_id
  AND m.recipient_id IS NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_conv      ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created   ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_users         ON conversations(user_a, user_b);
