const Cuidador = require('../models/Cuidador'); // O nome do Model pode ser com letra maiúscula
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Controller para REGISTRAR ---
exports.register = async (req, res) => {
  const { nome, email, senha, cpf, data_nascimento } = req.body;

  if (!nome || !email || !senha || !cpf || !data_nascimento) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const novoCuidador = await Cuidador.create({ nome, email, senha, cpf, data_nascimento });
    
    // Podemos criar um token aqui também se quisermos logar o usuário automaticamente após o registro
    // Por enquanto, vamos manter simples:
    res.status(201).json({
      message: 'Cuidador cadastrado com sucesso!',
      cuidador: novoCuidador,
    });
  } catch (error) {
    console.error('Erro ao cadastrar cuidador:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'O e-mail ou CPF informado já está em uso.' });
    }
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

// --- Controller para LOGIN (vamos implementar a fundo depois) ---
exports.login = async (req, res) => {
  // A lógica completa do login virá aqui.
  res.status(200).json({ message: 'Endpoint de login pronto para ser implementado.' });
};