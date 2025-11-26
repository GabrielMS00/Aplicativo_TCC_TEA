const Assistido = require('../models/Assistido');

exports.createAssistido = async (req, res) => {
  if (req.cuidador.tipo_usuario === 'padrao') {
    return res.status(403).json({ error: 'Usuários padrão não podem cadastrar novos assistidos.' });
  }

  const { nome, data_nascimento, nivel_suporte, grau_seletividade } = req.body;
  const cuidador_id = req.cuidador.id;

  if (!nome || !data_nascimento) {
    return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios.' });
  }

  try {
    const novoAssistido = await Assistido.create({
      nome,
      data_nascimento,
      nivel_suporte,
      grau_seletividade,
      cuidador_id,
    });
    res.status(201).json({
      message: 'Assistido cadastrado com sucesso!',
      assistido: novoAssistido,
    });
  } catch (error) {
    console.error('Erro ao cadastrar assistido:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};


exports.getAssistidos = async (req, res) => {
  try {
    const cuidador_id = req.cuidador.id;
    const assistidos = await Assistido.findByCuidadorId(cuidador_id);
    res.status(200).json(assistidos);
  } catch (error) {
    console.error('Erro ao buscar assistidos:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};


exports.getAssistidoById = async (req, res) => {
  const { id } = req.params;
  const cuidador_id = req.cuidador.id;

  try {
    // Busca garantindo que pertence ao cuidador logado
    const assistido = await Assistido.findByIdAndCuidadorId(id, cuidador_id);
    
    if (!assistido) {
      return res.status(404).json({ error: 'Assistido não encontrado.' });
    }

    res.status(200).json(assistido);
  } catch (error) {
    console.error('Erro ao buscar assistido por ID:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

exports.updateAssistido = async (req, res) => {
  const { id } = req.params; // Pega o ID da URL
  const cuidador_id = req.cuidador.id;
  const { nome, data_nascimento, nivel_suporte, grau_seletividade } = req.body;

  try {
    // Verifica se o assistido pertence ao cuidador logado
    const assistido = await Assistido.findByIdAndCuidadorId(id, cuidador_id);
    if (!assistido) {
      return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
    }

    // Se pertence, atualiza os dados
    const assistidoAtualizado = await Assistido.update(id, { nome, data_nascimento, nivel_suporte, grau_seletividade });
    res.status(200).json({
      message: 'Assistido atualizado com sucesso!',
      assistido: assistidoAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar assistido:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

exports.deleteAssistido = async (req, res) => {

  if (req.cuidador.tipo_usuario === 'padrao') {
    return res.status(403).json({ error: 'Usuários padrão não podem apagar assistidos.' });
  }

  const { id } = req.params; // Pega o ID da URL
  const cuidador_id = req.cuidador.id;

  try {
    // Verifica se o assistido pertence ao cuidador logado
    const assistido = await Assistido.findByIdAndCuidadorId(id, cuidador_id);
    if (!assistido) {
      return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
    }

    // Se pertence, apaga o assistido
    await Assistido.delete(id);
    res.status(200).json({ message: 'Assistido apagado com sucesso.' });
  } catch (error) {
    console.error('Erro ao apagar assistido:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};