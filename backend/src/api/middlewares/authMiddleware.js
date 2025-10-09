const jwt = require('jsonwebtoken');
const Cuidador = require('../models/Cuidador');

exports.protect = async (req, res, next) => {
  let token;

  // O token virá no cabeçalho da requisição, no formato "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Pega o token do cabeçalho
      token = req.headers.authorization.split(' ')[1];

      // 2. Verifica se o token é válido
      const decoded = jwt.verify(token, 'SUA_PALAVRA_SECRETA_SUPER_DIFICIL');

      // 3. Busca o usuário do token no banco e anexa à requisição
      req.cuidador = await Cuidador.findById(decoded.id).select('-senha_hash'); // (Precisaremos criar a função findById)
      
      next(); // Se tudo deu certo, permite que a requisição continue para o controller
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: 'Não autorizado, token falhou.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado, sem token.' });
  }
};