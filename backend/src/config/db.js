const { Pool } = require('pg');

// Cria a "piscina" de conexões com o banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exporta um objeto que tem uma função "query".
// Isso nos permite usar "db.query(...)" em qualquer outro lugar do nosso código.
module.exports = {
  query: (text, params) => pool.query(text, params),
};