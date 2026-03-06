const { Pool } = require('pg');

// Deteta se estamos num ambiente de produção (Render) ou local
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  // O Render/Supabase vão usar a DATABASE_URL. Localmente, usa as outras.
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'admin'}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE || 'tea_app_db'}`,
  // A nuvem exige SSL para conexões seguras
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};