const db = require('../../config/db');

const AlimentoSeguro = {
  /**
   * Adiciona um novo alimento à lista de seguros de um assistido.
   * Usa ON CONFLICT para evitar duplicatas e não gerar erro se já existir.
   */
  async create(assistidoId, alimentoId) {
    // Validação básica para evitar erro no DB se IDs forem nulos/inválidos
    if (!assistidoId || !alimentoId) {
        console.warn(`(Model AlimentoSeguro) Tentativa de inserir com IDs nulos: assistidoId=${assistidoId}, alimentoId=${alimentoId}`);
        return; // Não tenta inserir se os IDs são inválidos
    }
    const query = `
      INSERT INTO alimentos_seguros (assistido_id, alimento_id)
      VALUES ($1, $2)
      ON CONFLICT (assistido_id, alimento_id) DO NOTHING
    `;
    try {
        await db.query(query, [assistidoId, alimentoId]);
    } catch (error) {
        console.error(`(Model AlimentoSeguro) Erro ao inserir ${alimentoId} para assistido ${assistidoId}:`, error);
        // Considerar relançar o erro dependendo da criticidade
        // throw error;
    }
  }
};

module.exports = AlimentoSeguro;