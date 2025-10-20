
const db = require('../../config/db');

const AlimentoSeguro = {
 
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