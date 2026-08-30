-- ============================================================
-- Migration 001: Schema base
-- Idempotente — usa IF NOT EXISTS em todo o lado
-- NÃO destrói dados existentes
-- ============================================================

-- Utilizadores
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  UNIQUE NOT NULL,
  password     VARCHAR(255)  NOT NULL,
  level        VARCHAR(20)   NOT NULL DEFAULT 'pendente',
  nationality  VARCHAR(50)   NOT NULL DEFAULT 'Angolano',
  avatar_url   VARCHAR(500),
  bio          TEXT,
  created_at   TIMESTAMP     DEFAULT NOW()
);

-- Actualizar constraint de level para incluir 'pendente'
-- (não destrutivo — DROP IF EXISTS + ADD é idempotente)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_level_check;
ALTER TABLE users ADD CONSTRAINT users_level_check
  CHECK (level IN ('pendente','iniciante','junior','pleno','senior'));

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200)  NOT NULL,
  content      TEXT          NOT NULL,
  image_url    VARCHAR(500),
  file_url     VARCHAR(500),
  file_name    VARCHAR(200),
  created_at   TIMESTAMP     DEFAULT NOW()
);

-- Comentários
CREATE TABLE IF NOT EXISTS comments (
  id           SERIAL PRIMARY KEY,
  post_id      INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT          NOT NULL,
  created_at   TIMESTAMP     DEFAULT NOW()
);

-- Likes (PK composta garante unicidade)
CREATE TABLE IF NOT EXISTS likes (
  post_id      INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP     DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Índices base
CREATE INDEX IF NOT EXISTS idx_posts_user     ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created  ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post  ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post     ON likes(post_id);
