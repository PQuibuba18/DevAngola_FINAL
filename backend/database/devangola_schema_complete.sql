-- ============================================================
-- DevAngola — Schema Completo
-- Versão: FINAL (consolida todas as 5 fases)
-- 
-- INSTRUÇÃO: Cola tudo isto no Editor SQL do Neon e clica Correr.
-- Apaga e recria tudo do zero.
-- ============================================================

-- ── 1. Remove tudo na ordem correcta (respeita foreign keys) ──

DROP TABLE IF EXISTS verification_requests    CASCADE;
DROP TABLE IF EXISTS mentorship_requests      CASCADE;
DROP TABLE IF EXISTS mentors                  CASCADE;
DROP TABLE IF EXISTS project_applications     CASCADE;
DROP TABLE IF EXISTS project_skills           CASCADE;
DROP TABLE IF EXISTS project_members          CASCADE;
DROP TABLE IF EXISTS projects                 CASCADE;
DROP TABLE IF EXISTS job_applications         CASCADE;
DROP TABLE IF EXISTS job_skills               CASCADE;
DROP TABLE IF EXISTS job_posts                CASCADE;
DROP TABLE IF EXISTS notifications            CASCADE;
DROP TABLE IF EXISTS quiz_results             CASCADE;
DROP TABLE IF EXISTS quiz_questions           CASCADE;
DROP TABLE IF EXISTS user_skills              CASCADE;
DROP TABLE IF EXISTS messages                 CASCADE;
DROP TABLE IF EXISTS conversations            CASCADE;
DROP TABLE IF EXISTS follows                  CASCADE;
DROP TABLE IF EXISTS likes                    CASCADE;
DROP TABLE IF EXISTS comments                 CASCADE;
DROP TABLE IF EXISTS posts                    CASCADE;
DROP TABLE IF EXISTS users                    CASCADE;
DROP TABLE IF EXISTS _migrations              CASCADE;

-- ── 2. Tabela de controlo de migrations ───────────────────────

CREATE TABLE _migrations (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);

-- ── 3. Utilizadores ───────────────────────────────────────────

CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100)  NOT NULL,
  email            VARCHAR(150)  UNIQUE NOT NULL,
  password         VARCHAR(255)  NOT NULL,
  level            VARCHAR(20)   NOT NULL DEFAULT 'iniciante'
                   CHECK (level IN ('pendente','iniciante','junior','pleno','senior')),
  nationality      VARCHAR(50)   NOT NULL DEFAULT 'Angolano',
  avatar_url       VARCHAR(500),
  bio              TEXT,
  portfolio_url    VARCHAR(500),
  identifier       VARCHAR(100),
  role             VARCHAR(20)   NOT NULL DEFAULT 'user'
                   CHECK (role IN ('user','admin')),
  badge            VARCHAR(50),
  badge_label      VARCHAR(100),
  theme            VARCHAR(10)   NOT NULL DEFAULT 'light'
                   CHECK (theme IN ('light','dark')),
  language         VARCHAR(10)   NOT NULL DEFAULT 'pt'
                   CHECK (language IN ('pt','en')),
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  quiz_expires_at  TIMESTAMP,
  verified         BOOLEAN       NOT NULL DEFAULT FALSE,
  verified_at      TIMESTAMP,
  verification_method VARCHAR(50),
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_level    ON users(level);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_active   ON users(is_active);

-- ── 4. Posts ──────────────────────────────────────────────────

CREATE TABLE posts (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(200)  NOT NULL,
  content        TEXT          NOT NULL,
  image_url      VARCHAR(500),
  file_url       VARCHAR(500),
  file_name      VARCHAR(200),
  is_open_source BOOLEAN       NOT NULL DEFAULT FALSE,
  room           VARCHAR(20),
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_user     ON posts(user_id);
CREATE INDEX idx_posts_created  ON posts(created_at DESC);
CREATE INDEX idx_posts_room     ON posts(room);

-- ── 5. Comentários ────────────────────────────────────────────

CREATE TABLE comments (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT    NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);

-- ── 6. Gostos ─────────────────────────────────────────────────

CREATE TABLE likes (
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);

-- ── 7. Seguidores ─────────────────────────────────────────────

CREATE TABLE follows (
  follower_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower  ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ── 8. Conversas e Mensagens ──────────────────────────────────

CREATE TABLE conversations (
  id         SERIAL PRIMARY KEY,
  user_a     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_conv_unique_pair
  ON conversations (LEAST(user_a, user_b), GREATEST(user_a, user_b));

CREATE TABLE messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id    INTEGER          REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT    NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conv      ON messages(conversation_id);
CREATE INDEX idx_messages_sender    ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created   ON messages(created_at DESC);

-- ── 9. Notificações ───────────────────────────────────────────

CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(30) NOT NULL,
  post_id    INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- ── 10. Quiz ──────────────────────────────────────────────────

CREATE TABLE quiz_questions (
  id         SERIAL PRIMARY KEY,
  question   TEXT        NOT NULL,
  option_a   TEXT        NOT NULL,
  option_b   TEXT        NOT NULL,
  option_c   TEXT        NOT NULL,
  option_d   TEXT        NOT NULL,
  correct    CHAR(1)     NOT NULL CHECK (correct IN ('a','b','c','d')),
  category   VARCHAR(50) NOT NULL DEFAULT 'geral',
  difficulty SMALLINT    NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_quiz_active ON quiz_questions(is_active);

CREATE TABLE quiz_results (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score          SMALLINT  NOT NULL CHECK (score BETWEEN 0 AND 5),
  level_assigned VARCHAR(20) NOT NULL,
  taken_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);

-- ── 11. Vagas de Emprego ──────────────────────────────────────

CREATE TABLE job_posts (
  id             SERIAL PRIMARY KEY,
  company_name   VARCHAR(100)  NOT NULL,
  title          VARCHAR(200)  NOT NULL,
  description    TEXT          NOT NULL,
  level_required VARCHAR(20)   NOT NULL
                 CHECK (level_required IN ('iniciante','junior','pleno','senior','qualquer')),
  location       VARCHAR(100)  NOT NULL DEFAULT 'Luanda',
  type           VARCHAR(20)   NOT NULL DEFAULT 'full-time'
                 CHECK (type IN ('full-time','part-time','freelance','remoto')),
  contact_email  VARCHAR(150)  NOT NULL,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  posted_by      INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_active  ON job_posts(is_active);
CREATE INDEX idx_jobs_level   ON job_posts(level_required);
CREATE INDEX idx_jobs_created ON job_posts(created_at DESC);

CREATE TABLE job_skills (
  job_id INTEGER NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  skill  VARCHAR(50) NOT NULL,
  PRIMARY KEY (job_id, skill)
);

CREATE INDEX idx_job_skills ON job_skills(skill);

CREATE TABLE job_applications (
  id         SERIAL PRIMARY KEY,
  job_id     INTEGER NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  cover_note TEXT,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','reviewed','accepted','rejected')),
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, user_id)
);

CREATE INDEX idx_applications_job    ON job_applications(job_id);
CREATE INDEX idx_applications_user   ON job_applications(user_id);
CREATE INDEX idx_applications_status ON job_applications(status);

-- ── 12. Skills de Utilizador ──────────────────────────────────

CREATE TABLE user_skills (
  user_id INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill   VARCHAR(50) NOT NULL,
  level   SMALLINT    NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, skill)
);

CREATE INDEX idx_user_skills_skill ON user_skills(skill);

-- ── 13. Projectos Colaborativos ───────────────────────────────

CREATE TABLE projects (
  id          SERIAL PRIMARY KEY,
  owner_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT         NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','in_progress','completed','archived')),
  level_min   VARCHAR(20)  NOT NULL DEFAULT 'iniciante'
              CHECK (level_min IN ('iniciante','junior','pleno','senior')),
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_owner  ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);

CREATE TABLE project_members (
  project_id INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       VARCHAR(50) NOT NULL DEFAULT 'colaborador',
  joined_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_proj_members ON project_members(user_id);

CREATE TABLE project_skills (
  project_id INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill      VARCHAR(50) NOT NULL,
  filled     BOOLEAN     NOT NULL DEFAULT FALSE,
  PRIMARY KEY (project_id, skill)
);

CREATE TABLE project_applications (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       VARCHAR(50),
  message    TEXT,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','accepted','rejected')),
  applied_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_proj_apps ON project_applications(project_id);

-- ── 14. Mentoria ──────────────────────────────────────────────

CREATE TABLE mentors (
  user_id     INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  bio         TEXT,
  specialties TEXT[]   NOT NULL DEFAULT '{}',
  available   BOOLEAN  NOT NULL DEFAULT TRUE,
  max_mentees SMALLINT NOT NULL DEFAULT 3,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentors_available ON mentors(available);

CREATE TABLE mentorship_requests (
  id          SERIAL PRIMARY KEY,
  mentee_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT,
  skill_focus VARCHAR(50),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','accepted','rejected','completed')),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (mentee_id, mentor_id)
);

CREATE INDEX idx_mentorship_mentor ON mentorship_requests(mentor_id);
CREATE INDEX idx_mentorship_mentee ON mentorship_requests(mentee_id);

-- ── 15. Verificação de Identidade ─────────────────────────────

CREATE TABLE verification_requests (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  document_ref VARCHAR(500),
  reviewed_by  INTEGER REFERENCES users(id),
  reviewed_at  TIMESTAMP,
  reject_reason TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verif_user   ON verification_requests(user_id);
CREATE INDEX idx_verif_status ON verification_requests(status);

-- ── 16. Perguntas do Quiz (30 perguntas base) ─────────────────

INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct, category, difficulty) VALUES
-- JavaScript (difficulty 1)
('Qual é o resultado de typeof null em JavaScript?', '"null"', '"undefined"', '"object"', '"string"', 'c', 'javascript', 1),
('Qual método remove o último elemento de um array em JavaScript?', '.shift()', '.pop()', '.splice()', '.slice()', 'b', 'javascript', 1),
('O que faz o operador === em JavaScript?', 'Atribui um valor', 'Compara valor e tipo', 'Compara apenas valor', 'Declara uma variável', 'b', 'javascript', 1),
-- JavaScript (difficulty 2)
('Qual é a saída de: console.log(0.1 + 0.2 === 0.3)?', 'true', 'false', 'undefined', 'NaN', 'b', 'javascript', 2),
('O que é o Event Loop em JavaScript?', 'Um ciclo de eventos do DOM', 'Mecanismo que permite JavaScript executar operações assíncronas', 'Um tipo de loop for', 'Uma função de callback', 'b', 'javascript', 2),
('Qual a diferença entre let e var?', 'Não há diferença', 'let tem escopo de bloco, var tem escopo de função', 'var tem escopo de bloco', 'let é mais lento', 'b', 'javascript', 2),
-- JavaScript (difficulty 3)
('O que é closure em JavaScript?', 'Um método de array', 'Função que acede a variáveis do seu escopo externo após retornar', 'Um tipo de promise', 'Um método de objecto', 'b', 'javascript', 3),
('Qual é a saída de: [1,2,3].reduce((acc, val) => acc + val, 0)?', '0', '6', '3', 'undefined', 'b', 'javascript', 3),
-- HTML/CSS
('Qual tag HTML é usada para criar um link?', '<link>', '<a>', '<href>', '<url>', 'b', 'web', 1),
('Qual propriedade CSS é usada para mudar a cor do texto?', 'font-color', 'text-color', 'color', 'foreground', 'c', 'web', 1),
('O que significa CSS?', 'Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets', 'b', 'web', 1),
-- React
('O que é JSX em React?', 'Um ficheiro JavaScript', 'Extensão de sintaxe que mistura JavaScript e HTML', 'Um framework CSS', 'Uma base de dados', 'b', 'react', 1),
('Para que serve o hook useState?', 'Gerir rotas', 'Gerir estado local num componente funcional', 'Fazer pedidos HTTP', 'Gerir efeitos secundários', 'b', 'react', 2),
('Qual a função do useEffect?', 'Criar estado global', 'Executar efeitos secundários após renderização', 'Optimizar performance', 'Gerir formulários', 'b', 'react', 2),
-- Node.js
('O que é Node.js?', 'Um browser', 'Ambiente de execução JavaScript fora do browser', 'Um framework CSS', 'Uma base de dados', 'b', 'nodejs', 1),
('Qual módulo do Node.js é usado para criar um servidor HTTP?', 'fs', 'path', 'http', 'os', 'c', 'nodejs', 1),
('O que é npm?', 'Node Process Manager', 'Node Package Manager', 'Node Project Manager', 'New Project Module', 'b', 'nodejs', 1),
-- Bases de dados
('O que significa SQL?', 'Structured Query Language', 'Simple Query Language', 'System Query Logic', 'Secure Query Language', 'a', 'database', 1),
('Qual comando SQL é usado para buscar dados?', 'GET', 'FETCH', 'SELECT', 'FIND', 'c', 'database', 1),
('O que é uma chave primária (PRIMARY KEY)?', 'A primeira coluna da tabela', 'Coluna que identifica unicamente cada linha', 'Uma coluna obrigatória', 'O índice principal', 'b', 'database', 1),
-- Git
('O que faz o comando git commit?', 'Envia código para o servidor', 'Guarda as alterações no histórico local', 'Cria um novo ramo', 'Apaga alterações', 'b', 'git', 1),
('O que é um Pull Request?', 'Buscar alterações do servidor', 'Pedido para mesclar código numa branch', 'Criar um novo repositório', 'Apagar uma branch', 'b', 'git', 1),
-- Geral/Conceptual
('O que significa API?', 'Application Programming Interface', 'Automated Program Integration', 'Advanced Programming Index', 'Application Protocol Interface', 'a', 'geral', 1),
('O que é REST?', 'Uma base de dados', 'Estilo arquitectural para APIs web', 'Uma linguagem de programação', 'Um protocolo de segurança', 'b', 'geral', 1),
('O que é JSON?', 'Java Syntax Object Notation', 'JavaScript Object Notation', 'Java Standard Object Naming', 'JavaScript Online Notation', 'b', 'geral', 1),
-- Avançado
('O que é uma Promise em JavaScript?', 'Uma variável global', 'Objecto que representa conclusão ou falha de operação assíncrona', 'Uma função síncrana', 'Um tipo de loop', 'b', 'javascript', 3),
('O que é Docker?', 'Uma linguagem de programação', 'Plataforma de contentores para isolar aplicações', 'Um servidor web', 'Uma base de dados NoSQL', 'b', 'devops', 2),
('O que é SOLID?', 'Uma framework JavaScript', 'Conjunto de princípios de design orientado a objectos', 'Um tipo de base de dados', 'Um protocolo de rede', 'b', 'geral', 3),
('O que é Big O Notation?', 'Notação para tamanho de ficheiros', 'Forma de descrever complexidade de tempo/espaço de algoritmos', 'Uma notação matemática', 'Um padrão de código', 'b', 'geral', 3),
('O que é injecção SQL (SQL Injection)?', 'Um método de optimização', 'Vulnerabilidade onde código SQL malicioso é inserido em queries', 'Uma forma de inserir dados', 'Um tipo de migração', 'b', 'seguranca', 2);

-- ── 17. Regista migrations como aplicadas ─────────────────────

INSERT INTO _migrations (name) VALUES
  ('001_initial_schema.sql'),
  ('002_conversations.sql'),
  ('003_follows.sql'),
  ('004_users_extended.sql'),
  ('005_posts_extended.sql'),
  ('006_quiz.sql'),
  ('007_notifications.sql'),
  ('008_jobs.sql'),
  ('009_migration_control.sql'),
  ('010_job_applications.sql'),
  ('011_projects.sql'),
  ('012_mentorship.sql'),
  ('013_verification.sql'),
  ('014_users_portfolio.sql');

-- ── 18. Verificação final ─────────────────────────────────────

SELECT 'TABELAS CRIADAS:' AS info, COUNT(*) AS total
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'PERGUNTAS DO QUIZ:' AS info, COUNT(*) AS total FROM quiz_questions;
