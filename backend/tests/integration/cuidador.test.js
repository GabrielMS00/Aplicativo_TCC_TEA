const request = require('supertest');
// Força a senha para garantir conexão nos testes (caso o .env falhe)
process.env.DB_PASSWORD = '1234';

const app = require('../../src/app');
const db = require('../../src/config/db');
const { clearDatabase, createUserAndAssistido } = require('../utils/dbHelper');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let token;
let dadosUser;

beforeAll(async () => {
  await clearDatabase();
  // Cria usuário 'cuidador' (perfil completo)
  dadosUser = await createUserAndAssistido('cuidador'); 
  
  // Login para obter o token
  const resLogin = await request(app).post('/api/auth/login').send({
    email: dadosUser.email,
    senha: '12345678' // Senha padrão definida no dbHelper
  });
  token = resLogin.body.token;
});

afterAll(async () => { await db.pool.end(); });

describe('Cuidador (Integração)', () => {
  
  // --- Testes de Sucesso ---

  it('Ver perfil', async () => {
    const res = await request(app)
      .get('/api/cuidador/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', dadosUser.email);
  });

  it('Atualizar perfil', async () => {
    const timestamp = Date.now();
    const novoNome = `Nome Editado ${timestamp}`;
    const novoEmail = `update_${timestamp}@test.com`; // Email novo único
    // Gera CPF único (11 dígitos) evitando conflito
    const novoCpf = `${timestamp}`.slice(-9) + '99'; 

    const res = await request(app).put('/api/cuidador/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
          nome: novoNome, 
          email: novoEmail, 
          cpf: novoCpf, 
          data_nascimento: '1990-01-01' 
      });
    
    if(res.statusCode !== 200) console.log("Erro Update Cuidador:", res.body);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.cuidador.nome).toBe(novoNome);
    expect(res.body.cuidador.email).toBe(novoEmail);
  });

  // --- Testes de Erro (Para aumentar a Cobertura) ---

  it('Atualizar - Falhar (409) se usar email já existente', async () => {
    // 1. Cria outro usuário para "roubar" o email dele
    const outroUser = await createUserAndAssistido('cuidador');
    
    // 2. Tenta atualizar o usuário atual com o email do outro
    const res = await request(app).put('/api/cuidador/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        nome: 'Teste Duplicado', 
        email: outroUser.email, // Email que já existe!
        cpf: `${Date.now()}`.slice(-9) + '88', // CPF qualquer
        data_nascimento: '1990-01-01'
      });
      
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('Atualizar - Falhar (400) se faltar campos', async () => {
    const res = await request(app).put('/api/cuidador/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        nome: 'Falta Email' 
        // email, cpf faltando
      });
      
    expect(res.statusCode).toBe(400);
  });
});