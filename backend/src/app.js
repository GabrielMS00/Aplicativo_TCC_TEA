const express = require('express');
const app = express();

// Middleware para o Express entender JSON no corpo das requisições
app.use(express.json());
// Middleware para o Express entender dados de formulário
app.use(express.urlencoded({ extended: true }));

// Importa o roteador mestre
const apiRoutes = require('./api/routes/index');
// Define o prefixo /api para todas as rotas de negócio
app.use('/api', apiRoutes);

// Rota de verificação de saúde da API
app.get('/', (req, res) => {
  res.send('API do App TEA está funcionando!');
});

module.exports = app;