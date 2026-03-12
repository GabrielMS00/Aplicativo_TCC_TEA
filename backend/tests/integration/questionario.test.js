const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const { clearDatabase, createUserAndAssistido, seedQuestionario, seedAlimentosBasicos } = require('../utils/dbHelper');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let token, assistidoId, dadosQuest, alimentoNome;

beforeAll(async () => {
  await clearDatabase();
  
  const dados = await createUserAndAssistido('cuidador');
  assistidoId = dados.assistidoId;
  const res = await request(app).post('/api/auth/login').send({ email: dados.email, senha: '12345678' });
  token = res.body.token;

  await seedAlimentosBasicos(); 
  dadosQuest = await seedQuestionario();
  alimentoNome = dadosQuest.nomeAlimento;
  
  // Cria o alimento para teste de match
  await db.query("INSERT INTO alimentos (nome, grupo_alimentar) VALUES ($1, 'Teste') ON CONFLICT (nome) DO NOTHING", [alimentoNome]);
});

afterAll(async () => { await db.pool.end(); });

describe('Questionário (Integração)', () => {
  it('Responder questionário e processar', async () => {
    const res = await request(app).post(`/api/questionarios/${assistidoId}/responder`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        modelo_questionario_id: dadosQuest.modeloId,
        respostas: [{ pergunta_id: dadosQuest.perguntaId, opcao_id: dadosQuest.opcaoSempreId }]
      });
    
    expect(res.statusCode).toBe(201);
    await new Promise(r => setTimeout(r, 1000)); // Espera processamento async
  });
});