-- Migration 022: Startup & Funding Network

CREATE TABLE IF NOT EXISTS startups (
  id            SERIAL PRIMARY KEY,
  founder_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  tagline       VARCHAR(300),
  description   TEXT         NOT NULL,
  industry      VARCHAR(100) NOT NULL,  -- fintech, edtech, healthtech, agritech...
  stage         VARCHAR(30)  NOT NULL DEFAULT 'idea'
                CHECK (stage IN ('idea','mvp','early','growth','scaling')),
  city          VARCHAR(100) DEFAULT 'Luanda',
  website       VARCHAR(500),
  pitch_deck    VARCHAR(500), -- link para o deck
  logo_url      VARCHAR(500),
  is_hiring     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_seeking_investment BOOLEAN NOT NULL DEFAULT FALSE,
  is_seeking_cofounder  BOOLEAN NOT NULL DEFAULT FALSE,
  founded_year  SMALLINT,
  team_size     SMALLINT     DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS startup_members (
  startup_id   INTEGER NOT NULL REFERENCES startups(id)  ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  role         VARCHAR(100) NOT NULL DEFAULT 'Co-founder',
  joined_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (startup_id, user_id)
);

CREATE TABLE IF NOT EXISTS funding_opportunities (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL,
  type         VARCHAR(30)  NOT NULL
               CHECK (type IN ('grant','competition','incubator','accelerator','scholarship','investment','other')),
  organizer    VARCHAR(200) NOT NULL,
  amount       VARCHAR(100),            -- ex: "USD 10.000" ou "até Kz 5.000.000"
  deadline     DATE,
  application_url VARCHAR(500),
  eligibility  TEXT,
  is_angola_only BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   INTEGER REFERENCES users(id),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_matches (
  id             SERIAL PRIMARY KEY,
  requester_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startup_id     INTEGER REFERENCES startups(id) ON DELETE SET NULL,
  role_sought    VARCHAR(100), -- "CTO", "Designer", "Business Dev"
  message        TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','rejected')),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, target_id, startup_id)
);

CREATE INDEX IF NOT EXISTS idx_startups_founder   ON startups(founder_id);
CREATE INDEX IF NOT EXISTS idx_startups_industry  ON startups(industry);
CREATE INDEX IF NOT EXISTS idx_startups_stage     ON startups(stage);
CREATE INDEX IF NOT EXISTS idx_funding_type       ON funding_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_funding_deadline   ON funding_opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_founder_matches    ON founder_matches(requester_id);
