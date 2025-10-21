// Importa a aplicação Express configurada do app.js
const app = require('./src/app');

// Define a porta. Usa a variável de ambiente (para produção) ou 3001 (desenvolvimento).
const port = process.env.PORT || 3001;

// Inicia o servidor e o coloca para "ouvir" na porta definida.
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});