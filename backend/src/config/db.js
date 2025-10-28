const { Pool } = require('pg');

const pool = new Pool({
  // Lendo as variáveis que o docker-compose.yml nos deu
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});


module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};
