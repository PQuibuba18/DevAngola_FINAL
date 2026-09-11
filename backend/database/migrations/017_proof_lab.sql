-- Migration 017: Proof Lab — Desafios técnicos
-- "Não dizer que sabe. Provar que sabe."

CREATE TABLE IF NOT EXISTS challenges (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT         NOT NULL,
  category     VARCHAR(50)  NOT NULL, -- frontend, backend, mobile, devops, data, security, ai
  difficulty   VARCHAR(20)  NOT NULL DEFAULT 'junior'
               CHECK (difficulty IN ('iniciante','junior','pleno','senior')),
  instructions TEXT         NOT NULL,
  deadline_days SMALLINT    DEFAULT 7,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  is_sponsored BOOLEAN      NOT NULL DEFAULT FALSE,
  sponsor_name VARCHAR(100),              -- ex: "BFA", "Unitel"
  sponsor_logo VARCHAR(500),
  created_by   INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id           SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  repo_url     VARCHAR(500),              -- link GitHub/GitLab
  demo_url     VARCHAR(500),              -- link demo ao vivo
  description  TEXT,                     -- explicação da solução
  status       VARCHAR(20) NOT NULL DEFAULT 'submitted'
               CHECK (status IN ('submitted','under_review','approved','rejected')),
  score        SMALLINT,                 -- 0-100
  feedback     TEXT,                     -- feedback do avaliador
  reviewed_by  INTEGER REFERENCES users(id),
  reviewed_at  TIMESTAMP,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_category   ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_active     ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user      ON challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status    ON challenge_submissions(status);

-- Desafios iniciais para arrancar a plataforma
INSERT INTO challenges (title, description, category, difficulty, instructions, deadline_days) VALUES
('API REST com Express + PostgreSQL',
 'Constrói uma API REST completa para gestão de utilizadores com autenticação JWT.',
 'backend', 'junior',
 'Requisitos: endpoint de registo, login, listar utilizadores, editar perfil. Usar Express, PostgreSQL e JWT. Documentar os endpoints no README.',
 7),
('Dashboard React com dados reais',
 'Cria um dashboard em React que consuma uma API pública e mostre dados em gráficos.',
 'frontend', 'pleno',
 'Usa uma API pública (ex: OpenWeatherMap, CoinGecko). Mostra pelo menos 3 tipos de visualização. Código limpo e responsivo.',
 10),
('App Mobile com Expo — Lista de Tarefas',
 'Desenvolve uma app Android de lista de tarefas com persistência local.',
 'mobile', 'iniciante',
 'Usa React Native + Expo. Funcionalidades: criar, editar, eliminar e marcar tarefas. Persistência com AsyncStorage ou SQLite.',
 7),
('Sistema de Pagamentos Multicaixa (Simulação)',
 'Simula a integração com o sistema Multicaixa para uma loja online.',
 'backend', 'senior',
 'Cria um sistema que simule o fluxo de pagamento: geração de referência, verificação de pagamento, webhook de confirmação. Documentar o fluxo completo.',
 14);
