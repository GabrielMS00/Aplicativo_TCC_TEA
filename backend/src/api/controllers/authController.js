const Cuidador = require('../models/Cuidador');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { nome, email, senha, cpf, data_nascimento } = req.body;

  if (!nome || !email || !senha || !cpf || !data_nascimento) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  // Validação de senha (exemplo)
  if (senha.length < 8) {
     return res.status(400).json({ error: 'A senha precisa ter no mínimo 8 caracteres.' });
  }

  try {
    const cuidadorExistente = await Cuidador.findByEmail(email);
    if (cuidadorExistente) {
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }

    const novoCuidador = await Cuidador.create({ nome, email, senha, cpf, data_nascimento });

    res.status(201).json({
      message: 'Cuidador cadastrado com sucesso!',
      cuidador: {
        id: novoCuidador.id,
        nome: novoCuidador.nome,
        email: novoCuidador.email,
      },
      token: generateToken(novoCuidador.id)
    });

  } catch (error) {
    console.error('Erro ao cadastrar cuidador:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'O CPF informado já está em uso.' });
    }
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const cuidador = await Cuidador.findByEmail(email);
    if (!cuidador) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, cuidador.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    res.status(200).json({
      message: 'Login bem-sucedido!',
      cuidador: {
        id: cuidador.id,
        nome: cuidador.nome,
        email: cuidador.email,
      },
      token: generateToken(cuidador.id),
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};