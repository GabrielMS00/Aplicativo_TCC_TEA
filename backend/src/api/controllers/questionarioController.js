const Questionario = require('../models/Questionario');
const Resposta = require('../models/Resposta');
const { processarRespostasEGerarAlimentosSeguros } = require('../../services/processamentoQuestionarioService');

/**
 * Busca a lista de todos os modelos de questionários disponíveis.
 * Rota: GET /api/questionarios/modelos
 */
exports.getModelos = async (req, res) => {
  try {
    const modelos = await Questionario.findModelos();
    res.status(200).json(modelos);
  } catch (error) {
    console.error('Erro ao buscar modelos de questionários:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

/**
 * Busca a estrutura completa de um questionário (perguntas e opções).
 * Rota: GET /api/questionarios/modelos/:id
 */
exports.getModeloCompleto = async (req, res) => {
  try {
    const { id } = req.params;
    const perguntasComOpcoes = await Questionario.findModeloCompletoById(id);
    
    if (!perguntasComOpcoes) {
      return res.status(404).json({ error: 'Modelo de questionário não encontrado.' });
    }
    
    res.status(200).json(perguntasComOpcoes);
  } catch (error) {
    console.error('Erro ao buscar modelo completo:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

/**
 * Salva as respostas de um questionário para um assistido.
 * Rota: POST /api/questionarios/:assistidoId/responder
 */
exports.salvarRespostas = async (req, res) => {
  const { assistidoId } = req.params;
  const cuidadorId = req.cuidador.id; // Vem do middleware 'protect'
  const { modelo_questionario_id, respostas } = req.body; // respostas é um array: [{pergunta_id, opcao_id}]

  if (!modelo_questionario_id || !respostas || !Array.isArray(respostas) || respostas.length === 0) {
    return res.status(400).json({ error: 'Dados de resposta inválidos.' });
  }

  try {
    // 1. Cria o registro de que o questionário foi respondido
    const { id: questionarioRespondidoId } = await Resposta.createQuestionarioRespondido({
      assistido_id: assistidoId,
      cuidador_id: cuidadorId,
      modelo_questionario_id,
    });

    // 2. Formata as respostas para o batch insert
    const respostasParaSalvar = respostas.map(r => ({
      questionario_respondido_id: questionarioRespondidoId,
      modelo_pergunta_id: r.pergunta_id,
      modelo_opcao_resposta_id: r.opcao_id,
    }));

    // 3. Salva todas as respostas de uma vez
    await Resposta.createMany(respostasParaSalvar);
    
    // 4. (IMPORTANTE) Dispara o serviço de processamento em segundo plano
    // A gente não usa 'await' aqui para o usuário não ter que esperar
    processarRespostasEGerarAlimentosSeguros(assistidoId, questionarioRespondidoId)
      .catch(err => console.error('Erro no processamento de questionário em segundo plano:', err));

    res.status(201).json({ message: 'Respostas salvas com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar respostas:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};