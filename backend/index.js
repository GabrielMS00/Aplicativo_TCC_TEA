const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get('/', (req, res) => {
  res.send('API do App TEA está funcionando!');
});

app.get('/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.send(`Conexão com o banco bem-sucedida! Hora do banco: ${result.rows[0].now}`);
    client.release();
  } catch (err) {
    res.status(500).send(`Erro ao conectar com o banco de dados: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});