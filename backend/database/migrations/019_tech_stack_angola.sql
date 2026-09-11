-- Migration 019: Tech Stack Angola — Q&A contextualizado para Angola

CREATE TABLE IF NOT EXISTS qa_questions (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(300) NOT NULL,
  body         TEXT         NOT NULL,
  tags         TEXT[]       DEFAULT '{}',
  views        INTEGER      NOT NULL DEFAULT 0,
  is_solved    BOOLEAN      NOT NULL DEFAULT FALSE,
  angola_context BOOLEAN    NOT NULL DEFAULT FALSE, -- marca questões específicas de Angola
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_answers (
  id           SERIAL PRIMARY KEY,
  question_id  INTEGER NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  body         TEXT    NOT NULL,
  is_accepted  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_votes (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id  INTEGER REFERENCES qa_questions(id) ON DELETE CASCADE,
  answer_id    INTEGER REFERENCES qa_answers(id)   ON DELETE CASCADE,
  value        SMALLINT NOT NULL CHECK (value IN (1, -1)), -- upvote ou downvote
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  -- só pode votar numa coisa por vez
  CHECK ((question_id IS NOT NULL) != (answer_id IS NOT NULL)),
  UNIQUE (user_id, question_id),
  UNIQUE (user_id, answer_id)
);

CREATE INDEX IF NOT EXISTS idx_qa_questions_user   ON qa_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_solved ON qa_questions(is_solved);
CREATE INDEX IF NOT EXISTS idx_qa_answers_question ON qa_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_votes_question   ON qa_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_votes_answer     ON qa_votes(answer_id);

-- Perguntas iniciais para dar vida à secção
INSERT INTO qa_questions (user_id, title, body, tags, angola_context) VALUES
(1, 'Como integrar pagamentos Multicaixa numa aplicação Node.js?',
 'Estou a desenvolver uma loja online em Angola e preciso de integrar pagamentos via Multicaixa Express. Alguém já fez isso e pode partilhar a abordagem?',
 ARRAY['nodejs','multicaixa','pagamentos','angola'], TRUE),
(1, 'Qual o melhor banco em Angola para obter uma API de pagamentos?',
 'Estou a desenvolver um sistema de pagamentos e preciso de integrar com um banco angolano. Quais bancos têm APIs disponíveis para developers?',
 ARRAY['angola','banking','api','pagamentos'], TRUE),
(1, 'Como registar uma empresa de software em Angola?',
 'Quero formalizar a minha empresa de desenvolvimento de software em Angola. Qual o processo, custos e documentos necessários?',
 ARRAY['angola','startup','legal','empresa'], TRUE);
