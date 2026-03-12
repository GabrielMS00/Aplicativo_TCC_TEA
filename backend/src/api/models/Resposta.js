const db = require('../../config/db');

const Resposta = {

  //Cria um registro na tabela questionarios_respondidos.
  async createQuestionarioRespondido({ assistido_id, cuidador_id, modelo_questionario_id }) {
    const query = `
      INSERT INTO questionarios_respondidos (assistido_id, cuidador_id, modelo_questionario_id)
      VALUES ($1, $2, $3)
      RETURNING id, data_resposta
    `;
    const values = [assistido_id, cuidador_id, modelo_questionario_id];
    try {
        const { rows } = await db.query(query, values);
        if (rows.length === 0) {
            throw new Error('Falha ao inserir questionario_respondido, nenhum ID retornado.');
        }
        console.log(`(Model Resposta) Criado questionario_respondido ID: ${rows[0].id}`);
        return rows[0]; // Retorna { id, data_resposta }
    } catch (error) {
        console.error('(Model Resposta) Erro em createQuestionarioRespondido:', error);
        throw error; // Re-lança o erro para o controller tratar
    }
  },

  /**
   //Insere múltiplas respostas na tabela respostas.
   * Usa uma única query para eficiência (batch insert).
   * @param {Array<object>} respostas - Array de objetos { questionario_respondido_id, modelo_pergunta_id, modelo_opcao_resposta_id }
   */
  async createMany(respostas) {
    if (!respostas || respostas.length === 0) {
      return 0; // Nada a inserir
    }

    // Monta a query de inserção múltipla
    const valuesPlaceholders = [];
    const valuesData = [];
    let paramIndex = 1;

    respostas.forEach(r => {
      valuesPlaceholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      valuesData.push(r.questionario_respondido_id, r.modelo_pergunta_id, r.modelo_opcao_resposta_id);
    });

    const query = `
      INSERT INTO respostas (questionario_respondido_id, modelo_pergunta_id, modelo_opcao_resposta_id)
      VALUES ${valuesPlaceholders.join(', ')}
    `;

    try {
        const result = await db.query(query, valuesData);
        console.log(`(Model Resposta) Inseridas ${result.rowCount} respostas para questionario_respondido_id: ${respostas[0]?.questionario_respondido_id}`);
        return result.rowCount; // Retorna o número de linhas inseridas
    } catch (error) {
        console.error('(Model Resposta) Erro em createMany:', error);
        console.error('   Dados que falharam:', JSON.stringify(respostas, null, 2)); // Loga os dados
        throw error; // Re-lança o erro
    }
  }
};

module.exports = Resposta;