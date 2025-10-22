const db = require('../../config/db');

const Questionario = {
  /**
   * Busca todos os modelos de questionários disponíveis (ex: "Frequência Alimentar").
   */
  async findModelos() {
    const query = 'SELECT id, nome FROM modelos_questionarios ORDER BY nome';
    const { rows } = await db.query(query);
    return rows;
  },

  /**
   * Busca um modelo de questionário específico com todas as suas perguntas e opções.
   */
  async findModeloCompletoById(id) {
    // Query para buscar o modelo e suas perguntas
    const perguntasQuery = `
      SELECT id, texto_pergunta 
      FROM modelos_perguntas 
      WHERE modelo_questionario_id = $1
    `;
    const perguntasRes = await db.query(perguntasQuery, [id]);
    
    if (perguntasRes.rows.length === 0) {
      return null; // Nenhum questionário encontrado com esse ID
    }
    
    // Query para buscar todas as opções de todas as perguntas de uma vez
    const perguntasIds = perguntasRes.rows.map(p => p.id);
    const opcoesQuery = `
      SELECT id, texto_opcao, modelo_pergunta_id
      FROM modelos_opcoes_respostas
      WHERE modelo_pergunta_id = ANY($1::uuid[])
    `;
    const opcoesRes = await db.query(opcoesQuery, [perguntasIds]);
    
    // Monta o objeto final
    const perguntasComOpcoes = perguntasRes.rows.map(pergunta => {
      return {
        ...pergunta,
        opcoes: opcoesRes.rows.filter(opcao => opcao.modelo_pergunta_id === pergunta.id)
      };
    });

    return perguntasComOpcoes;
  }
};

module.exports = Questionario;