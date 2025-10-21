const jwt = require('jsonwebtoken');
const Cuidador = require('../models/Cuidador');

// TODO: Mover para o .env
const JWT_SECRET = 'sua_palavra_secreta_super_dificil_pode_mudar_depois';

exports.protect = async (req, res, next) => {
  let token;

  // O token deve vir no cabeçalho 'Authorization' no formato 'Bearer <token>'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verifica se o token é válido
      const decoded = jwt.verify(token, JWT_SECRET);

      // Busca o usuário do token no banco e anexa à requisição
      req.cuidador = await Cuidador.findById(decoded.id);
      
      if (!req.cuidador) {
        return res.status(401).json({ error: 'Não autorizado, usuário não encontrado.' });
      }

      next(); // Permite a requisição continuar
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado, sem token.' });
  }
};