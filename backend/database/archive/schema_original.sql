
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  UNIQUE NOT NULL,
  password     VARCHAR(255)  NOT NULL,
  level        VARCHAR(20)   NOT NULL CHECK (level IN ('iniciante','junior','pleno','senior')),
  nationality  VARCHAR(50)   NOT NULL DEFAULT 'Angolano',
  avatar_url   VARCHAR(500),
  bio          TEXT,
  created_at   TIMESTAMP     DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS comments (
  id           SERIAL PRIMARY KEY,
  post_id      INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT          NOT NULL,
  created_at   TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  post_id      INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP     DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id           SERIAL PRIMARY KEY,
  user_a       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP     DEFAULT NOW(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER       NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT          NOT NULL,
  read            BOOLEAN       DEFAULT FALSE,
  created_at      TIMESTAMP     DEFAULT NOW(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user        ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created     ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post     ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post        ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv     ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created  ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_users        ON conversations(user_a, user_b);


-- ================================================================
-- DevAngola — Migração 002: Sistema de Seguidores
-- Executar no Neon SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS follows (
  follower_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
