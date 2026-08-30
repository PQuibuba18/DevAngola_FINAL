-- ================================================================
-- DevAngola v4 — Actualizações do Schema
-- ================================================================
-- IMPORTANTE: Execute este ficheiro COMPLETO no Neon SQL Editor
-- Depois execute o UPDATE abaixo com o teu email real
-- ================================================================

-- 1. Novos campos na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role        VARCHAR(20)  DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge       VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_label VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS identifier  VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme       VARCHAR(10)  DEFAULT 'light';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language    VARCHAR(10)  DEFAULT 'pt';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active   BOOLEAN      DEFAULT TRUE;

-- 2. Novo campo nos posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_open_source BOOLEAN DEFAULT FALSE;

-- 3. Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(30) NOT NULL,
  post_id    INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabelas de conversas e mensagens (se ainda não existem)
CREATE TABLE IF NOT EXISTS conversations (
  id        SERIAL PRIMARY KEY,
  user_a    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (LEAST(user_a, user_b), GREATEST(user_a, user_b))
);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT    NOT NULL,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_posts_open_source  ON posts(is_open_source);
CREATE INDEX IF NOT EXISTS idx_messages_conv      ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_users         ON conversations(user_a, user_b);

-- ================================================================
-- PASSO FINAL — PROMOVER O TEU UTILIZADOR A ADMIN
-- Substitui 'teu@email.ao' pelo email com que te registaste
-- ================================================================
UPDATE users SET role = 'admin' WHERE email = 'QuibubaAdmin@email.ao';

-- Verificação — deverás ver as tabelas listadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
