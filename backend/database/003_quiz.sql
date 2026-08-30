-- ================================================================
-- DevAngola — Migração 003: Quiz de Nível
-- Executar no Neon SQL Editor ANTES de arrancar o servidor
-- ================================================================

-- 1. Remover o CHECK que obriga a um nivel valido no cadastro
--    O nivel "pendente" nao existia antes
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_level_check;
ALTER TABLE users ADD CONSTRAINT users_level_check
  CHECK (level IN ('pendente','iniciante','junior','pleno','senior'));

-- 2. Campo de expiração do quiz
ALTER TABLE users ADD COLUMN IF NOT EXISTS quiz_expires_at TIMESTAMP;

-- 3. Banco de perguntas
CREATE TABLE IF NOT EXISTS quiz_questions (
  id         SERIAL PRIMARY KEY,
  question   TEXT         NOT NULL,
  option_a   TEXT         NOT NULL,
  option_b   TEXT         NOT NULL,
  option_c   TEXT         NOT NULL,
  option_d   TEXT         NOT NULL,
  correct    CHAR(1)      NOT NULL CHECK (correct IN ('a','b','c','d')),
  category   VARCHAR(50)  NOT NULL DEFAULT 'geral',
  difficulty SMALLINT     NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 4. Resultados do quiz por utilizador
CREATE TABLE IF NOT EXISTS quiz_results (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score          SMALLINT  NOT NULL CHECK (score BETWEEN 0 AND 5),
  level_assigned VARCHAR(20) NOT NULL,
  taken_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, taken_at)
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(is_active);

-- ================================================================
-- Banco inicial de perguntas (30 perguntas calibradas)
-- ================================================================
INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct, category, difficulty) VALUES

-- Dificuldade 1 — Iniciante
('O que significa HTML?',
 'HyperText Markup Language',
 'High Transfer Markup Language',
 'HyperText Management Link',
 'Hyper Transfer Machine Logic',
 'a', 'web', 1),

('Qual destas opções é uma linguagem de programação?',
 'HTML', 'CSS', 'Python', 'XML',
 'c', 'geral', 1),

('O que é uma variável em programação?',
 'Um ficheiro de configuração',
 'Um espaço na memória para guardar dados',
 'Um tipo de ciclo',
 'Uma função especial',
 'b', 'geral', 1),

('Qual símbolo se usa para comentários de linha única em JavaScript?',
 '<!-- -->', '##', '//', '**',
 'c', 'javascript', 1),

('O que faz um ciclo "for"?',
 'Verifica uma condição uma vez',
 'Repete um bloco de código um número definido de vezes',
 'Define uma função',
 'Liga dois ficheiros',
 'b', 'geral', 1),

('O que é CSS?',
 'Uma linguagem de programação de servidor',
 'Uma linguagem de base de dados',
 'Uma folha de estilos para definir o visual de páginas web',
 'Um protocolo de rede',
 'c', 'web', 1),

('O que significa URL?',
 'Uniform Resource Locator',
 'Universal Runtime Language',
 'Unique Reference Link',
 'User Request Layer',
 'a', 'web', 1),

('Qual operador verifica igualdade estrita em JavaScript?',
 '=', '==', '===', '!==',
 'c', 'javascript', 1),

('O que é um array?',
 'Uma função que retorna valores',
 'Uma colecção ordenada de elementos',
 'Um tipo de ciclo',
 'Uma ligação entre duas variáveis',
 'b', 'geral', 1),

('O que faz a instrução "return" numa função?',
 'Termina o programa',
 'Inicia um ciclo',
 'Devolve um valor da função e termina a sua execução',
 'Importa um módulo',
 'c', 'geral', 1),

-- Dificuldade 2 — Júnior
('Qual é a diferença entre "let" e "const" em JavaScript?',
 'Não há diferença',
 '"let" permite reatribuição, "const" não',
 '"const" permite reatribuição, "let" não',
 '"let" é para números, "const" para texto',
 'b', 'javascript', 2),

('O que é uma API REST?',
 'Um tipo de base de dados relacional',
 'Uma interface que usa HTTP para comunicação entre sistemas seguindo princípios REST',
 'Um framework de JavaScript',
 'Um protocolo de segurança',
 'b', 'backend', 2),

('O que faz o método .map() em JavaScript?',
 'Filtra elementos de um array',
 'Ordena um array',
 'Cria um novo array transformando cada elemento',
 'Remove duplicados de um array',
 'c', 'javascript', 2),

('O que é Git?',
 'Um editor de código',
 'Uma linguagem de programação',
 'Um sistema de controlo de versões',
 'Um servidor web',
 'c', 'ferramentas', 2),

('O que significa SQL?',
 'Structured Query Language',
 'Simple Question Logic',
 'System Query Link',
 'Server Queue Language',
 'a', 'base-de-dados', 2),

('Qual é a função do "index" numa base de dados?',
 'Apagar registos duplicados',
 'Acelerar as operações de pesquisa',
 'Criar relações entre tabelas',
 'Fazer cópias de segurança',
 'b', 'base-de-dados', 2),

('O que é o DOM?',
 'Database Object Model',
 'Document Object Model — representação em árvore de uma página HTML',
 'Dynamic Output Module',
 'Distributed Object Manager',
 'b', 'web', 2),

('O que é JSON?',
 'JavaScript Object Notation — formato leve de troca de dados',
 'Java Secure Object Network',
 'Just Structured Output Notation',
 'JavaScript Open Notation',
 'a', 'geral', 2),

('Qual HTTP status code indica que um recurso não foi encontrado?',
 '200', '301', '404', '500',
 'c', 'backend', 2),

('O que é o conceito de "callback" em JavaScript?',
 'Uma variável global',
 'Uma função passada como argumento a outra função para ser chamada posteriormente',
 'Um tipo especial de ciclo',
 'Uma excepção de erro',
 'b', 'javascript', 2),

-- Dificuldade 3 — Pleno / Sénior
('O que é o Event Loop em JavaScript?',
 'Um ciclo for especial para eventos de rato',
 'O mecanismo que permite a JavaScript executar código assíncrono numa thread única',
 'Um tipo de listener de DOM',
 'Uma API do browser para animações',
 'b', 'javascript', 3),

('Qual é a diferença entre autenticação e autorização?',
 'São sinónimos',
 'Autenticação verifica identidade; autorização verifica permissões',
 'Autorização verifica identidade; autenticação verifica permissões',
 'Autenticação é para APIs, autorização é para web',
 'b', 'seguranca', 3),

('O que é um índice composto numa base de dados relacional?',
 'Um índice que cobre todas as colunas de uma tabela',
 'Um índice criado em múltiplas colunas para optimizar queries com vários filtros',
 'Um índice automático criado pelo SGBD',
 'Um índice que substitui a chave primária',
 'b', 'base-de-dados', 3),

('O que é o padrão Repository em arquitectura de software?',
 'Um serviço que faz cache de dados na memória',
 'Uma camada de abstracção entre a lógica de negócio e o acesso a dados',
 'Um tipo de base de dados NoSQL',
 'Um padrão para organizar rotas HTTP',
 'b', 'arquitectura', 3),

('O que é o conceito de "N+1 query problem"?',
 'Um erro que ocorre quando se fazem mais de N queries por segundo',
 'Uma situação onde se executa 1 query principal e depois N queries adicionais para dados relacionados, causando ineficiência',
 'Um limite de ligações simultâneas a uma base de dados',
 'Um tipo de deadlock em transacções',
 'b', 'base-de-dados', 3),

('O que é um JWT (JSON Web Token)?',
 'Um formato de base de dados',
 'Um protocolo de encriptação simétrica',
 'Um token compacto e auto-contido para transmitir informação de forma segura entre partes como JSON',
 'Uma biblioteca JavaScript para validação de formulários',
 'c', 'seguranca', 3),

('O que é o conceito de "idempotência" numa API REST?',
 'A capacidade de uma API processar múltiplos pedidos em paralelo',
 'A propriedade de uma operação produzir o mesmo resultado independentemente de ser executada uma ou múltiplas vezes',
 'A capacidade de uma API versionar os seus endpoints',
 'A propriedade de uma API de funcionar sem autenticação',
 'b', 'backend', 3),

('O que é um deadlock numa base de dados?',
 'Uma query que demora demasiado tempo a executar',
 'Uma situação onde duas ou mais transacções ficam bloqueadas mutuamente, cada uma à espera que a outra liberte recursos',
 'Um erro de sintaxe SQL',
 'Uma falha de ligação ao servidor',
 'b', 'base-de-dados', 3),

('O que é o padrão SOLID?',
 'Um conjunto de 5 princípios de design de software orientado a objectos para tornar o código mais manutenível',
 'Uma metodologia de gestão de projectos de software',
 'Um protocolo de comunicação entre microserviços',
 'Um conjunto de regras para nomear variáveis',
 'a', 'arquitectura', 3),

('O que é o conceito de "eventual consistency" em sistemas distribuídos?',
 'A garantia de que todos os nós têm sempre os mesmos dados em tempo real',
 'A garantia de que, dado tempo suficiente sem novas actualizações, todos os nós convergem para o mesmo valor',
 'A propriedade de um sistema de processar pedidos por ordem de chegada',
 'A capacidade de um sistema de se auto-recuperar de falhas',
 'b', 'sistemas', 3);
