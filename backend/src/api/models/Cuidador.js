// src/api/models/Cuidador.js
const db = require('../../config/db');
const bcrypt = require('bcryptjs');

const Cuidador = {
  // A única função que precisamos por agora é a de criar
  async create({ nome, email, senha, cpf, data_nascimento }) {
    // Hashear a senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    // Query SQL para inserir o novo cuidador
    const query = `
      INSERT INTO cuidadores (nome, email, senha_hash, cpf, data_nascimento)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, email, data_cadastro
    `;
    const values = [nome, email, senha_hash, cpf, data_nascimento];

    // Executar a query
    const { rows } = await db.query(query, values);
    return rows[0];
  }
};

module.exports = Cuidador;