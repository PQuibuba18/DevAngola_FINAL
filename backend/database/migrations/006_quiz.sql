-- ============================================================
-- Migration 006: Sistema de Quiz
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id         SERIAL PRIMARY KEY,
  question   TEXT         NOT NULL,
  option_a   TEXT         NOT NULL,
  option_b   TEXT         NOT NULL,
  option_c   TEXT         NOT NULL,
  option_d   TEXT         NOT NULL,
  correct    CHAR(1)      NOT NULL CHECK (correct IN ('a','b','c','d')),
  category   VARCHAR(50)  NOT NULL DEFAULT 'geral',
  difficulty SMALLINT     NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score          SMALLINT  NOT NULL CHECK (score BETWEEN 0 AND 5),
  level_assigned VARCHAR(20) NOT NULL,
  taken_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, taken_at)
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user     ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(is_active);
