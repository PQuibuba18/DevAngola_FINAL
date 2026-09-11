-- Migration 018: Work Exchange — Marketplace de trabalho

CREATE TABLE IF NOT EXISTS work_projects (
  id           SERIAL PRIMARY KEY,
  client_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL,
  category     VARCHAR(50)  NOT NULL,
  budget_min   INTEGER,                  -- em Kz ou USD
  budget_max   INTEGER,
  currency     VARCHAR(3)   DEFAULT 'AOA',
  deadline     DATE,
  status       VARCHAR(20)  NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in_progress','completed','cancelled')),
  selected_dev INTEGER      REFERENCES users(id),
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_proposals (
  id             SERIAL PRIMARY KEY,
  project_id     INTEGER NOT NULL REFERENCES work_projects(id) ON DELETE CASCADE,
  developer_id   INTEGER NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  cover_letter   TEXT,
  proposed_price INTEGER,
  proposed_days  SMALLINT,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','rejected')),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, developer_id)
);

CREATE TABLE IF NOT EXISTS work_milestones (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES work_projects(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  due_date     DATE,
  amount       INTEGER,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','in_progress','delivered','approved')),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_reviews (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES work_projects(id) ON DELETE CASCADE,
  reviewer_id  INTEGER NOT NULL REFERENCES users(id),
  reviewee_id  INTEGER NOT NULL REFERENCES users(id),
  score        SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment      TEXT,
  type         VARCHAR(10) NOT NULL CHECK (type IN ('client','developer')),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_work_projects_client   ON work_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_work_projects_status   ON work_projects(status);
CREATE INDEX IF NOT EXISTS idx_work_proposals_project ON work_proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_work_proposals_dev     ON work_proposals(developer_id);
CREATE INDEX IF NOT EXISTS idx_work_milestones        ON work_milestones(project_id);
