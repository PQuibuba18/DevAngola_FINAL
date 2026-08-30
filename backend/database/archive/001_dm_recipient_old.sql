CREATE TABLE IF NOT EXISTS conversations (
  id           SERIAL PRIMARY KEY,
  user_a       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER       NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT          NOT NULL,
  read            BOOLEAN       DEFAULT FALSE,
  created_at      TIMESTAMP     DEFAULT NOW()
);

UPDATE conversations
SET user_a = LEAST(user_a, user_b),
    user_b = GREATEST(user_a, user_b)
WHERE user_a > user_b;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_a_user_b_key;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_least_greatest_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_ordered_pair'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_ordered_pair CHECK (user_a < user_b);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_users_pair ON conversations (user_a, user_b);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

UPDATE messages m
SET recipient_id = CASE
  WHEN m.sender_id = c.user_a THEN c.user_b
  ELSE c.user_a
END
FROM conversations c
WHERE c.id = m.conversation_id
  AND m.recipient_id IS NULL;

ALTER TABLE messages ALTER COLUMN recipient_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_recipient_diff'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_sender_recipient_diff CHECK (sender_id <> recipient_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_conv      ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created   ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_users         ON conversations(user_a, user_b);
