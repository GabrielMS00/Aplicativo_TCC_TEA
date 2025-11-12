const db = require('../../config/db');
const bcrypt = require('bcryptjs');

// Helper para usar o client da transação (se existir) ou o pool padrão
const getQueryRunner = (client) => client || db;

const Cuidador = {

  async create({ nome, email, senha, cpf, data_nascimento, tipo_usuario }, client) {
    const runner = getQueryRunner(client); // Usa o 'runner'
    
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    const query = `
      INSERT INTO cuidadores (nome, email, senha_hash, cpf, data_nascimento, tipo_usuario)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nome, email, data_cadastro, tipo_usuario
    `;
    const values = [nome, email, senha_hash, cpf, data_nascimento, tipo_usuario || 'cuidador'];

    const { rows } = await runner.query(query, values); // Usa o 'runner'
    return rows[0];
  },


  async findByEmail(email) {
    const query = 'SELECT * FROM cuidadores WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },


  async findById(id) {
    const query = 'SELECT id, nome, email, cpf, data_nascimento, data_cadastro, tipo_usuario FROM cuidadores WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },


  async update(id, { nome, email, cpf, data_nascimento }) {
    const query = `
      UPDATE cuidadores
      SET nome = $1, email = $2, cpf = $3, data_nascimento = $4
      WHERE id = $5
      RETURNING id, nome, email, cpf, data_nascimento, data_cadastro, tipo_usuario
    `;
    const values = [nome, email, cpf, data_nascimento, id];

    const { rows } = await db.query(query, values);
    return rows[0];
  }
  
};

module.exports = Cuidador;