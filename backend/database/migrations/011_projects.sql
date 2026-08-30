-- Migration 011: Sistema de Projectos Colaborativos
-- Utilizadores publicam projectos e recrutam colaboradores com skills específicas.
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT         NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in_progress','completed','archived')),
  level_min   VARCHAR(20)  DEFAULT 'iniciante'
               CHECK (level_min IN ('iniciante','junior','pleno','senior')),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       VARCHAR(50) NOT NULL DEFAULT 'colaborador',
  joined_at  TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Skills que o projecto necessita
CREATE TABLE IF NOT EXISTS project_skills (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill      VARCHAR(50) NOT NULL,
  filled     BOOLEAN DEFAULT FALSE, -- true quando existe membro com esta skill
  PRIMARY KEY (project_id, skill)
);

CREATE TABLE IF NOT EXISTS project_applications (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       VARCHAR(50),
  message    TEXT,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','accepted','rejected')),
  applied_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner  ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_proj_members    ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_proj_apps       ON project_applications(project_id);
