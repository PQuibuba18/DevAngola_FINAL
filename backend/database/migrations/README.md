# DevAngola — Migrations

## Como funciona

Cada ficheiro `.sql` nesta pasta é uma migration.
O runner (`src/scripts/migrate.js`) aplica apenas as que ainda não foram aplicadas.
A tabela `_migrations` no banco regista o histórico.

## Regras obrigatórias

- Cada migration é **idempotente**: usa `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc.
- Nunca usar `DROP TABLE`, `DROP DATABASE` ou `DELETE FROM` sem aprovação explícita.
- Nunca alterar ou renomear migrations já aplicadas em produção.
- Novas migrations recebem o próximo número em sequência.

## Uso

```bash
# Ver o que seria aplicado (sem alterar nada)
npm run migrate:dry

# Aplicar migrations pendentes
npm run migrate
```

## Ordem das migrations

| Ficheiro | Conteúdo |
|---|---|
| 001_initial_schema.sql | Tabelas base: users, posts, comments, likes |
| 002_conversations.sql  | Conversas e mensagens (resolve conflito de constraints) |
| 003_follows.sql        | Sistema de seguidores |
| 004_users_extended.sql | role, badge, is_active, theme, language, identifier |
| 005_posts_extended.sql | is_open_source, room |
| 006_quiz.sql           | quiz_questions, quiz_results |
| 007_notifications.sql  | notifications |
| 008_jobs.sql           | job_posts |
| 009_migration_control.sql | tabela _migrations (criada automaticamente pelo runner) |

## Ao adicionar uma nova migration

1. Cria `010_nome_descritivo.sql`
2. Usa apenas operações idempotentes
3. Testa com `npm run migrate:dry` primeiro
4. Documenta aqui na tabela acima
