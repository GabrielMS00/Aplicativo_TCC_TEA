const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Middlewares para a API entender JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rota de teste da raiz (opcional, mas boa para verificar se o servidor está no ar)
app.get('/', (req, res) => {
  res.send('API do App TEA está funcionando!');
});

// Importa e usa o nosso roteador principal
const apiRoutes = require('./api/routes/index');
// Todas as nossas rotas de negócio começarão com o prefixo /api
app.use('/api', apiRoutes);

module.exports = app;