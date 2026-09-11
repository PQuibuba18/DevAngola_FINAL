-- Migration 021: Events & Ecosystem

CREATE TABLE IF NOT EXISTS events (
  id               SERIAL PRIMARY KEY,
  organizer_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  description      TEXT         NOT NULL,
  category         VARCHAR(50)  NOT NULL
                   CHECK (category IN ('meetup','hackathon','conference','workshop','bootcamp','webinar','competition','other')),
  location_name    VARCHAR(200),
  location_address VARCHAR(300),
  city             VARCHAR(100) DEFAULT 'Luanda',
  is_online        BOOLEAN      NOT NULL DEFAULT FALSE,
  online_url       VARCHAR(500),
  start_date       TIMESTAMP    NOT NULL,
  end_date         TIMESTAMP,
  registration_url VARCHAR(500),
  cover_url        VARCHAR(500),
  max_participants INTEGER,
  is_free          BOOLEAN      NOT NULL DEFAULT TRUE,
  price            INTEGER,               -- em Kz se não for free
  is_featured      BOOLEAN      NOT NULL DEFAULT FALSE,
  status           VARCHAR(20)  NOT NULL DEFAULT 'upcoming'
                   CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participants (
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  attended     BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category  ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_city      ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_date      ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status    ON events(status);
