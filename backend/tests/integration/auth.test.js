const path = require('path');
// Garante que as variáveis de ambiente sejam carregadas
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const request = require('supertest');
// Força a senha para garantir conexão nos testes (caso o .env falhe)
process.env.DB_PASSWORD = '1234';

const app = require('../../src/app');
const db = require('../../src/config/db');
const { clearDatabase } = require('../utils/dbHelper');

beforeAll(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await db.pool.end();
});

describe('Autenticação (Integração)', () => {
  const timestamp = Date.now();
  
  // Dados dinâmicos para evitar conflitos
  const testUser = {
    nome: 'User Auth Test',
    email: `auth_${timestamp}@test.com`,
    senha: 'password123',
    cpf: `${timestamp}`.slice(-9) + '00', // Garante 11 dígitos
    data_nascimento: '2000-01-01',
    tipo_usuario: 'padrao',
    
    // CAMPOS OBRIGATÓRIOS:
    palavra_seguranca: 'batata123',
    nivel_suporte: '1',
    grau_seletividade: 'leve'
  };

  // --- Casos de Sucesso ---

  it('Registrar usuário com sucesso', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('Login com sucesso', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      senha: testUser.senha
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // --- Casos de Erro (Para aumentar a Cobertura) ---

  it('Registrar - Falhar se faltar campos obrigatórios', async () => {
    const userInvalido = { ...testUser };
    delete userInvalido.email; // Remove email propositalmente
    
    const res = await request(app).post('/api/auth/register').send(userInvalido);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('Registrar - Falhar com senha curta', async () => {
    const userSenhaFraca = { 
        ...testUser, 
        senha: '123', 
        email: `fraca_${Date.now()}@test.com`,
        cpf: `${Date.now()}`.slice(-9) + '99'
    };
    const res = await request(app).post('/api/auth/register').send(userSenhaFraca);
    expect(res.statusCode).toBe(400);
  });

  it('Login - Falhar com credenciais erradas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      senha: 'senhaerrada'
    });
    expect(res.statusCode).toBe(401);
  });

  it('Login - Falhar com email inexistente', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'naoexiste@email.com',
      senha: '123'
    });
    expect(res.statusCode).toBe(401);
  });
});