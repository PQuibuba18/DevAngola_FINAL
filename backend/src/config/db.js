// config/db.js
// Pool PostgreSQL configurada para ambiente serverless (Vercel + Neon).
//
// Por que max:3?
//   - Vercel pode ter muitas instâncias serverless simultâneas
//   - Neon free tier tem ~50 conexões máximas
//   - Com 3 por instância e ~10 instâncias activas = 30 conexões (margem segura)
//   - Em produção com tráfego real, considerar Supabase (pgBouncer incluso)
//
// Por que idleTimeoutMillis e connectionTimeoutMillis?
//   - Serverless: funções morrem rapidamente, conexões idle devem ser fechadas
//   - connectionTimeoutMillis: evita requests a pendurar indefinidamente
//   - statementTimeout: mata queries lentas que possam bloquear o banco

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max:                    3,      // máximo de conexões por instância
  min:                    0,      // não mantém conexões abertas em idle
  idleTimeoutMillis:  10000,      // fecha conexões idle após 10s
  connectionTimeoutMillis: 5000,  // erro se não conectar em 5s
});

// Log de conexão inicial — apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('[db] Erro ao conectar:', err.message);
      return;
    }
    release();
    console.log('[db] Conectado ao PostgreSQL');
  });
}

// Detecta e loga erros de pool não capturados
pool.on('error', (err) => {
  console.error('[db] Erro inesperado no pool:', err.message);
});

module.exports = pool;
