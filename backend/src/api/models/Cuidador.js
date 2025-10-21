const db = require('../../config/db');
const bcrypt = require('bcryptjs');

const Cuidador = {
  /**
   * Cria um novo cuidador com senha hasheada.
   */
  async create({ nome, email, senha, cpf, data_nascimento }) {
    // Gera um "sal" e criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    const query = `
      INSERT INTO cuidadores (nome, email, senha_hash, cpf, data_nascimento)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, email, data_cadastro
    `;
    const values = [nome, email, senha_hash, cpf, data_nascimento];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  /**
   * Encontra um cuidador pelo seu e-mail (usado no login).
   * Retorna o usuário completo, incluindo a senha hasheada para verificação.
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM cuidadores WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    return rows[0]; // Retorna o usuário (com senha_hash) ou undefined
  },

  /**
   * Encontra um cuidador pelo seu ID (usado para verificar o token).
   * Não retorna a senha hasheada por segurança.
   */
  async findById(id) {
    const query = 'SELECT id, nome, email, cpf, data_nascimento, data_cadastro FROM cuidadores WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
};

module.exports = Cuidador;