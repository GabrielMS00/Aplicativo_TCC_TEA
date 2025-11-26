const { Pool } = require('pg');

// Tenta pegar as variáveis do Docker (DB_*) ou do arquivo .env local (POSTGRES_*)
const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_DATABASE || process.env.POSTGRES_DB || 'tea_app_db',
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'admin',
  password: "Caio12082000",
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};