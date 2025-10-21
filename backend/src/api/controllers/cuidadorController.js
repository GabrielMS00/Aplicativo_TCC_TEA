const Cuidador = require('../models/Cuidador');

// GET /api/cuidador/perfil
exports.getPerfil = (req, res) => {
  // O middleware 'protect' já colocou o usuário em 'req.cuidador'
  res.status(200).json(req.cuidador);
};

// PUT /api/cuidador/perfil
exports.updatePerfil = async (req, res) => {
  // Pega o ID do token, não do body, para segurança
  const cuidadorId = req.cuidador.id;
  const { nome, email, cpf, data_nascimento } = req.body;

  try {
    // Validação básica
    if (!nome || !email || !cpf || !data_nascimento) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    const cuidadorAtualizado = await Cuidador.update(cuidadorId, { nome, email, cpf, data_nascimento });
    res.status(200).json({
      message: 'Perfil atualizado com sucesso!',
      cuidador: cuidadorAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'O e-mail ou CPF informado já está em uso por outra conta.' });
    }
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};