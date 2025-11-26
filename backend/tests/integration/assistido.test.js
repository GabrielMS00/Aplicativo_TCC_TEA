const request = require('supertest');
process.env.DB_PASSWORD = '1234';

const app = require('../../src/app');
const db = require('../../src/config/db');
const { clearDatabase, createUserAndAssistido } = require('../utils/dbHelper');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let token;

beforeAll(async () => {
  await clearDatabase();
  const dados = await createUserAndAssistido('cuidador');
  
  const resLogin = await request(app).post('/api/auth/login').send({ 
    email: dados.email, 
    senha: '12345678' 
  });
  token = resLogin.body.token;
});

afterAll(async () => { await db.pool.end(); });

describe('Assistido (Integração)', () => {
  let assistidoId;

  // --- Testes de Erro ---

  it('POST / - Deve falhar (400) se faltar nome', async () => {
    const res = await request(app)
      .post('/api/assistidos')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
          data_nascimento: '2015-05-05', 
          nivel_suporte: '1', 
          grau_seletividade: 'leve' 
      });
    expect(res.statusCode).toBe(400);
  });

  it('PUT /:id - Deve falhar (404) ao tentar editar assistido inexistente', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .put(`/api/assistidos/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Nada' });
    expect(res.statusCode).toBe(404);
  });

  it('DELETE /:id - Deve falhar (404) se ID não existir', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).delete(`/api/assistidos/${fakeId}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  // --- Testes de Sucesso (CRUD) ---

  it('CRUD Completo Assistido', async () => {
    // Criar
    const resCreate = await request(app).post('/api/assistidos').set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Filho Teste', data_nascimento: '2015-05-05', nivel_suporte: '1', grau_seletividade: 'leve' });
    expect(resCreate.statusCode).toBe(201);
    assistidoId = resCreate.body.assistido.id;

    // Listar
    const resList = await request(app).get('/api/assistidos').set('Authorization', `Bearer ${token}`);
    expect(resList.statusCode).toBe(200);
    expect(resList.body.length).toBeGreaterThan(0);

    // Atualizar
    const resUpdate = await request(app).put(`/api/assistidos/${assistidoId}`).set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Filho Editado', data_nascimento: '2015-05-05', nivel_suporte: '1', grau_seletividade: 'leve' });
    expect(resUpdate.statusCode).toBe(200);

    // Deletar
    const resDel = await request(app).delete(`/api/assistidos/${assistidoId}`).set('Authorization', `Bearer ${token}`);
    expect(resDel.statusCode).toBe(200);
  });
});