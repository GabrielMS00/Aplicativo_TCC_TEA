// Importa a aplicação Express configurada do app.js
const app = require('./src/app');
const path = require('path');

// Carrega as variáveis do .env da raiz do projeto
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Define a porta. Usa a variável de ambiente (para produção) ou 3001 (desenvolvimento).
const port = process.env.PORT || 3001;

// Inicia o servidor e o coloca para "ouvir" na porta definida.
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});