-- ================================================================
-- DevAngola — Migração 005: Salas por Nivel
-- Executar no Neon SQL Editor
-- ================================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS room VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_posts_room ON posts(room);

-- Posts existentes ficam com room NULL (pertencem ao feed geral)
-- Novos posts publicados numa sala terao room = 'junior' | 'pleno' | 'senior' | 'iniciante'
