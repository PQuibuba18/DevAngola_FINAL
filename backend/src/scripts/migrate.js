#!/usr/bin/env node
// scripts/migrate.js — executa migrations pendentes por ordem numérica
// Uso: node src/scripts/migrate.js
//      node src/scripts/migrate.js --dry-run

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');
const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function run() {
  const client = await pool.connect();
  try {
    // Cria tabela de controlo se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(200) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const applied = await client.query('SELECT name FROM _migrations ORDER BY name');
    const appliedSet = new Set(applied.rows.map(r => r.name));

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log('\nDevAngola Migrations');
    console.log('  Aplicadas: ' + appliedSet.size + ' / Disponíveis: ' + files.length);
    if (isDryRun) console.log('  Modo: DRY-RUN\n');
    else console.log();

    let applied_count = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log('  SKIP  ' + file);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log('  RUN   ' + file + '...');

      if (!isDryRun) {
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log('  OK    ' + file);
          applied_count++;
        } catch (err) {
          await client.query('ROLLBACK');
          console.error('  FAIL  ' + file + ' — ' + err.message);
          process.exit(1);
        }
      } else {
        console.log('  WOULD ' + file);
        applied_count++;
      }
    }

    console.log('\nConcluido. Aplicadas: ' + applied_count + '\n');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
