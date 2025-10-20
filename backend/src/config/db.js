const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool 
};