const db = require('../../config/db');

const AlimentoSeguro = {
  /**
   * Adiciona um novo alimento à lista de seguros de um assistido.
   * Usa ON CONFLICT para evitar duplicatas.
   */
  async create(assistidoId, alimentoId) {
    const query = `
      INSERT INTO alimentos_seguros (assistido_id, alimento_id)
      VALUES ($1, $2)
      ON CONFLICT (assistido_id, alimento_id) DO NOTHING
    `;
    await db.query(query, [assistidoId, alimentoId]);
  }
};

module.exports = AlimentoSeguro;