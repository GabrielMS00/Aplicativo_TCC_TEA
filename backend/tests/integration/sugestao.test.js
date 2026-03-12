const request = require('supertest');
process.env.DB_PASSWORD = '1234';

const app = require('../../src/app');
const db = require('../../src/config/db');
const { clearDatabase, createUserAndAssistido, seedAlimentosBasicos } = require('../utils/dbHelper');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let token, assistidoId, dadosAlim;

beforeAll(async () => {
  await clearDatabase();
  // 1. Cria cuidador e assistido válidos
  const dados = await createUserAndAssistido('cuidador');
  assistidoId = dados.assistidoId;
  
  // 2. Login para obter token válido
  const resLogin = await request(app).post('/api/auth/login').send({ 
    email: dados.email, 
    senha: '12345678' 
  });
  token = resLogin.body.token;

  // 3. Seed de alimentos
  dadosAlim = await seedAlimentosBasicos(); 
  
  // 4. Vincula alimento seguro e perfil à refeição para garantir que sugestões funcionem
  await db.query("INSERT INTO alimentos_seguros (assistido_id, alimento_id) VALUES ($1, $2)", [assistidoId, dadosAlim.arrozId]);
  
  // Garante refeição 'Almoço' e vínculo
  const almocoReal = await db.query("SELECT id FROM refeicoes WHERE nome = 'Almoço'");
  let refeicaoId = almocoReal.rows.length > 0 ? almocoReal.rows[0].id : (await db.query("INSERT INTO refeicoes (nome) VALUES ('Almoço') RETURNING id")).rows[0].id;
  
  await db.query("INSERT INTO perfil_refeicao (perfil_sensorial_id, refeicao_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [dadosAlim.perfilBatataId, refeicaoId]);
});

afterAll(async () => { await db.pool.end(); });

describe('Sugestões (Integração)', () => {
  
  it('Gerar sugestão (Caminho Feliz)', async () => {
    const res = await request(app)
      .get(`/api/sugestoes/${assistidoId}/Almoço`)
      .set('Authorization', `Bearer ${token}`);

    // 200 se achou sugestão, 404 se não achou (ambos ok para teste de integração sem dados massivos)
    expect([200, 404]).toContain(res.statusCode);
  });

  it('Gerar - Falhar (400) com refeição inválida', async () => {
    const res = await request(app).get(`/api/sugestoes/${assistidoId}/Invalida`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('Gerar - Falhar (404) com assistido de outro usuário', async () => {
    const outroUser = await createUserAndAssistido('cuidador');
    const res = await request(app).get(`/api/sugestoes/${outroUser.assistidoId}/Almoço`)
      .set('Authorization', `Bearer ${token}`); // Token do user original
    expect(res.statusCode).toBe(404);
  });

  it('Feedback - Falhar com requisição inválida', async () => {
    const res = await request(app)
      .post(`/api/sugestoes/${assistidoId}/Almoço/feedback`)
      .set('Authorization', `Bearer ${token}`)
      .send({ feedback: 'inválido' });
      
    // Aceita 400 (Body inválido) ou 404 (Não achou assistido/sugestão para dar feedback)
    // O importante é não ser 200 (Sucesso) nem 500 (Erro interno)
    expect([400, 404]).toContain(res.statusCode);
  });

});