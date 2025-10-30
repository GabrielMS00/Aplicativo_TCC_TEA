// backend/src/api/models/AlimentoSeguro.js
const db = require('../../config/db');

// Helper para usar a query do client (se existir) ou do pool (se não)
const getQueryRunner = (client) => client || db;

const AlimentoSeguro = {
  /**
   * Adiciona um novo alimento à lista de seguros de um assistido.
   * Pode receber um 'client' opcional para rodar dentro de uma transação.
   */
  async create(assistidoId, alimentoId, client) {
    const runner = getQueryRunner(client); // Usa o client da transação se fornecido
    if (!assistidoId || !alimentoId) {
        console.warn(`(Model AlimentoSeguro) Tentativa de inserir com IDs nulos: assistidoId=${assistidoId}, alimentoId=${alimentoId}`);
        throw new Error('IDs nulos fornecidos para AlimentoSeguro.create');
    }
    const query = `
      INSERT INTO alimentos_seguros (assistido_id, alimento_id)
      VALUES ($1, $2)
      ON CONFLICT (assistido_id, alimento_id) DO NOTHING
    `;
    try {
        await runner.query(query, [assistidoId, alimentoId]);
    } catch (error) {
        console.error(`(Model AlimentoSeguro) Erro ao inserir ${alimentoId} para assistido ${assistidoId}:`, error);
        throw error; // Re-lança o erro para o service tratar (rollback)
    }
  },

  /**
   * Remove um alimento da lista de seguros de um assistido.
   * Pode receber um 'client' opcional para rodar dentro de uma transação.
   */
  async delete(assistidoId, alimentoId, client) {
    const runner = getQueryRunner(client); // Usa o client da transação se fornecido
    if (!assistidoId || !alimentoId) {
        console.warn(`(Model AlimentoSeguro) Tentativa de deletar com IDs nulos: assistidoId=${assistidoId}, alimentoId=${alimentoId}`);
        throw new Error('IDs nulos fornecidos para AlimentoSeguro.delete');
    }
    const query = `
      DELETE FROM alimentos_seguros
      WHERE assistido_id = $1 AND alimento_id = $2
    `;
    try {
        await runner.query(query, [assistidoId, alimentoId]);
    } catch (error) {
        console.error(`(Model AlimentoSeguro) Erro ao deletar ${alimentoId} para assistido ${assistidoId}:`, error);
        throw error; // Re-lança o erro para o service tratar (rollback)
    }
  }
};

module.exports = AlimentoSeguro;