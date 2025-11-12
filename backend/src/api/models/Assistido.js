const db = require('../../config/db');

// Helper para usar o client da transação (se existir) ou o pool padrão
const getQueryRunner = (client) => client || db;

const Assistido = {
  async create({ nome, data_nascimento, nivel_suporte, grau_seletividade, cuidador_id }, client) {
    const runner = getQueryRunner(client);
    
    const query = `
      INSERT INTO assistidos (nome, data_nascimento, nivel_suporte, grau_seletividade, cuidador_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [nome, data_nascimento, nivel_suporte, grau_seletividade, cuidador_id];

    const { rows } = await runner.query(query, values); // Usa o 'runner'
    return rows[0];
  },


  async findByCuidadorId(cuidador_id) {
    // login fará a consulta do assistido "fantasma" separadamente.
    const query = 'SELECT * FROM assistidos WHERE cuidador_id = $1 ORDER BY nome ASC';
    const { rows } = await db.query(query, [cuidador_id]);
    return rows;
  },

  async findByIdAndCuidadorId(id, cuidador_id) {
    const query = 'SELECT * FROM assistidos WHERE id = $1 AND cuidador_id = $2';
    const { rows } = await db.query(query, [id, cuidador_id]);
    return rows[0];
  },

  async update(id, { nome, data_nascimento, nivel_suporte, grau_seletividade }) {
    const query = `
      UPDATE assistidos
      SET nome = $1, data_nascimento = $2, nivel_suporte = $3, grau_seletividade = $4
      WHERE id = $5
      RETURNING *
    `;
    const values = [nome, data_nascimento, nivel_suporte, grau_seletividade, id];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM assistidos WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
};

module.exports = Assistido;