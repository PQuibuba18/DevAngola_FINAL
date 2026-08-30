-- ============================================================
-- Migration 005: Campos estendidos de posts
-- Adiciona is_open_source e room
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_open_source BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS room           VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_posts_open_source ON posts(is_open_source);
CREATE INDEX IF NOT EXISTS idx_posts_room        ON posts(room);
