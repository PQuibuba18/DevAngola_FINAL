-- Migration 020: Open Source & Project Network

CREATE TABLE IF NOT EXISTS open_source_projects (
  id            SERIAL PRIMARY KEY,
  owner_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT         NOT NULL,
  repo_url      VARCHAR(500) NOT NULL, -- GitHub/GitLab link
  demo_url      VARCHAR(500),
  website_url   VARCHAR(500),
  stack         TEXT[]       DEFAULT '{}', -- ['react','nodejs','postgresql']
  category      VARCHAR(50),             -- web, mobile, api, tool, library
  status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','archived','seeking_contributors')),
  stars_count   INTEGER      NOT NULL DEFAULT 0,
  is_featured   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS open_source_contributors (
  project_id   INTEGER NOT NULL REFERENCES open_source_projects(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(50) DEFAULT 'contributor', -- owner, maintainer, contributor
  joined_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS open_source_stars (
  project_id   INTEGER NOT NULL REFERENCES open_source_projects(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starred_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_oss_owner    ON open_source_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_oss_status   ON open_source_projects(status);
CREATE INDEX IF NOT EXISTS idx_oss_featured ON open_source_projects(is_featured);
