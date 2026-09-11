-- Migration 016: Professional Passport
-- Entidades mínimas necessárias — reutiliza tudo o que já existe.
-- Não duplica: users, user_skills, projects, mentors, quiz_results, job_applications

-- ── Experiência profissional (historial declarado) ────────────
-- O utilizador declara onde trabalhou / estudou / colaborou.
-- Verificável por outros mas não auto-aprovado.
CREATE TABLE IF NOT EXISTS professional_experience (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(20)  NOT NULL DEFAULT 'work'
              CHECK (type IN ('work','education','freelance','volunteer')),
  title       VARCHAR(150) NOT NULL,
  organization VARCHAR(150) NOT NULL,
  location    VARCHAR(100),
  start_date  DATE         NOT NULL,
  end_date    DATE,                        -- NULL = presente
  description TEXT,
  is_current  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exp_user ON professional_experience(user_id);

-- ── Reviews profissionais ─────────────────────────────────────
-- Um utilizador avalia outro após colaboração real (projecto ou trabalho).
-- Sem self-review. Uma review por par.
CREATE TABLE IF NOT EXISTS professional_reviews (
  id          SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score       SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  context     VARCHAR(50), -- 'project' | 'job' | 'mentorship' | 'collaboration'
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, reviewee_id),
  CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON professional_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON professional_reviews(reviewer_id);

-- ── Talent Score (calculado, não declarado) ───────────────────
-- Recalculado quando há mudanças relevantes (quiz, projecto, review, verificação).
-- Nunca manipulável directamente pelo utilizador.
CREATE TABLE IF NOT EXISTS talent_scores (
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  score               INTEGER NOT NULL DEFAULT 0,
  score_identity      SMALLINT DEFAULT 0,  -- verificação identidade
  score_skills        SMALLINT DEFAULT 0,  -- skills declaradas + quiz
  score_projects      SMALLINT DEFAULT 0,  -- projectos concluídos
  score_reviews       SMALLINT DEFAULT 0,  -- reviews recebidas
  score_community     SMALLINT DEFAULT 0,  -- posts, likes, comentários
  score_mentorship    SMALLINT DEFAULT 0,  -- mentoria dada/recebida
  score_reliability   SMALLINT DEFAULT 0,  -- candidaturas aceites
  computed_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- O score é recalculado por trigger ou job — nunca editado directamente
CREATE OR REPLACE FUNCTION recompute_talent_score(p_user_id INTEGER)
RETURNS VOID AS $$
DECLARE
  s_identity    SMALLINT := 0;
  s_skills      SMALLINT := 0;
  s_projects    SMALLINT := 0;
  s_reviews     SMALLINT := 0;
  s_community   SMALLINT := 0;
  s_mentorship  SMALLINT := 0;
  s_reliability SMALLINT := 0;
  total         INTEGER  := 0;
BEGIN
  -- Identidade verificada (+20)
  SELECT CASE WHEN verified THEN 20 ELSE 0 END INTO s_identity
  FROM users WHERE id = p_user_id;

  -- Skills: 2pts por skill declarada, máx 20
  SELECT LEAST(COUNT(*)::SMALLINT * 2, 20) INTO s_skills
  FROM user_skills WHERE user_id = p_user_id;

  -- Quiz: bónus por nível
  s_skills := s_skills + COALESCE((
    SELECT CASE level
      WHEN 'senior'   THEN 15
      WHEN 'pleno'    THEN 10
      WHEN 'junior'   THEN 5
      WHEN 'iniciante'THEN 2
      ELSE 0
    END FROM users WHERE id = p_user_id
  ), 0);
  s_skills := LEAST(s_skills, 30);

  -- Projectos concluídos como membro (+5 cada, máx 25)
  SELECT LEAST(COUNT(*)::SMALLINT * 5, 25) INTO s_projects
  FROM project_members pm
  JOIN projects p ON p.id = pm.project_id
  WHERE pm.user_id = p_user_id AND p.status = 'completed';

  -- Reviews recebidas: média × 4, máx 20
  SELECT LEAST(COALESCE(ROUND(AVG(score))::SMALLINT * 4, 0), 20) INTO s_reviews
  FROM professional_reviews WHERE reviewee_id = p_user_id;

  -- Comunidade: posts × 1 + likes recebidos × 0.5, máx 15
  SELECT LEAST(
    COALESCE(COUNT(DISTINCT p.id), 0)
    + COALESCE((SELECT COUNT(*) FROM likes l JOIN posts pp ON pp.id = l.post_id WHERE pp.user_id = p_user_id) / 2, 0),
    15
  )::SMALLINT INTO s_community
  FROM posts p WHERE p.user_id = p_user_id;

  -- Mentoria: mentor activo (+10), mentee aceite (+5)
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM mentors WHERE user_id = p_user_id AND available = TRUE
  ) THEN 10 ELSE 0 END INTO s_mentorship;

  s_mentorship := s_mentorship + COALESCE((
    SELECT LEAST(COUNT(*)::SMALLINT * 5, 10)
    FROM mentorship_requests WHERE mentee_id = p_user_id AND status = 'accepted'
  ), 0);
  s_mentorship := LEAST(s_mentorship, 15);

  -- Fiabilidade: candidaturas aceites (+5 cada, máx 10)
  SELECT LEAST(COUNT(*)::SMALLINT * 5, 10) INTO s_reliability
  FROM job_applications WHERE user_id = p_user_id AND status = 'accepted';

  total := s_identity + s_skills + s_projects + s_reviews + s_community + s_mentorship + s_reliability;

  INSERT INTO talent_scores
    (user_id, score, score_identity, score_skills, score_projects,
     score_reviews, score_community, score_mentorship, score_reliability, computed_at)
  VALUES
    (p_user_id, total, s_identity, s_skills, s_projects,
     s_reviews, s_community, s_mentorship, s_reliability, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    score            = EXCLUDED.score,
    score_identity   = EXCLUDED.score_identity,
    score_skills     = EXCLUDED.score_skills,
    score_projects   = EXCLUDED.score_projects,
    score_reviews    = EXCLUDED.score_reviews,
    score_community  = EXCLUDED.score_community,
    score_mentorship = EXCLUDED.score_mentorship,
    score_reliability= EXCLUDED.score_reliability,
    computed_at      = NOW();
END;
$$ LANGUAGE plpgsql;
