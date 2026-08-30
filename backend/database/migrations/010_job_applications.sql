-- Migration 010: Candidaturas a vagas
-- Um utilizador pode candidatar-se a uma vaga uma única vez.
-- O estado evolui: pending → reviewed → accepted / rejected
CREATE TABLE IF NOT EXISTS job_applications (
  id         SERIAL PRIMARY KEY,
  job_id     INTEGER NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  cover_note TEXT,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','reviewed','accepted','rejected')),
  applied_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job    ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user   ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);

-- Diferencial 9: skills declaradas por utilizador (base do portfólio automático)
CREATE TABLE IF NOT EXISTS user_skills (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill      VARCHAR(50) NOT NULL,
  level      SMALLINT DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user  ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill);

-- Skills declaradas nas vagas (permite matching preciso)
CREATE TABLE IF NOT EXISTS job_skills (
  job_id  INTEGER NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  skill   VARCHAR(50) NOT NULL,
  PRIMARY KEY (job_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_job_skills_job   ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill);
