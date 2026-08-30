-- Migration 012: Sistema de Mentoria
-- Séniores declaram disponibilidade. Qualquer nível pode pedir mentoria.
CREATE TABLE IF NOT EXISTS mentors (
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  bio          TEXT,
  specialties  TEXT[], -- array de skills: ARRAY['react','nodejs']
  available    BOOLEAN NOT NULL DEFAULT TRUE,
  max_mentees  SMALLINT DEFAULT 3,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentorship_requests (
  id          SERIAL PRIMARY KEY,
  mentee_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT,
  skill_focus VARCHAR(50),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','rejected','completed')),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (mentee_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS idx_mentors_available ON mentors(available);
CREATE INDEX IF NOT EXISTS idx_mentorship_mentor ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_mentee ON mentorship_requests(mentee_id);
