const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const { clearDatabase, createUserAndAssistido, seedAlimentosBasicos } = require('../utils/dbHelper');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let token, assistidoId, dadosAlim;

beforeAll(async () => {
  await clearDatabase();
  const dados = await createUserAndAssistido('cuidador');
  assistidoId = dados.assistidoId;
  
  const resLogin = await request(app).post('/api/auth/login').send({ 
    email: dados.email, 
    senha: '12345678' 
  });
  token = resLogin.body.token;

  dadosAlim = await seedAlimentosBasicos();

  // --- SEED DE DADOS PARA O RELATÓRIO ---

  // 1. Cria uma troca e detalhes para aparecer no histórico
  const almoco = await db.query("SELECT id FROM refeicoes WHERE nome LIKE 'Almoço%' LIMIT 1");
  const refeicaoId = almoco.rows[0].id;

  const troca = await db.query(
    "INSERT INTO trocas_alimentares (refeicao, assistido_id) VALUES ($1, $2) RETURNING id", 
    ['Almoço', assistidoId]
  );
  await db.query(
    `INSERT INTO detalhes_troca (troca_alimentar_id, alimento_novo_id, perfil_sensorial_id, status, motivo_sugestao)
     VALUES ($1, $2, $3, 'aceito', 'Teste Motivo')`,
    [troca.rows[0].id, dadosAlim.batataId, dadosAlim.perfilBatataId]
  );

  // 2. Cria um questionário respondido para aparecer na seção de questionários
  const modelo = await db.query("INSERT INTO modelos_questionarios (nome) VALUES ('QFA Teste') RETURNING id");
  const perg = await db.query("INSERT INTO modelos_perguntas (texto_pergunta, modelo_questionario_id) VALUES ('Gosta de Batata?', $1) RETURNING id", [modelo.rows[0].id]);
  const op = await db.query("INSERT INTO modelos_opcoes_respostas (texto_opcao, modelo_pergunta_id) VALUES ('Sim', $1) RETURNING id", [perg.rows[0].id]);
  
  const respHead = await db.query("INSERT INTO questionarios_respondidos (assistido_id, cuidador_id, modelo_questionario_id) VALUES ($1, $2, $3) RETURNING id", [assistidoId, dados.cuidadorId, modelo.rows[0].id]);
  
  await db.query("INSERT INTO respostas (questionario_respondido_id, modelo_pergunta_id, modelo_opcao_resposta_id) VALUES ($1, $2, $3)", [respHead.rows[0].id, perg.rows[0].id, op.rows[0].id]);
});

afterAll(async () => { await db.pool.end(); });

describe('Relatórios (Integração)', () => {
  
  it('GET /api/relatorios/:assistidoId/geral - Deve retornar estrutura completa', async () => {
    const res = await request(app)
      .get(`/api/relatorios/${assistidoId}/geral`) 
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    
    // Valida a estrutura do objeto retornado pelo seu controller
    expect(res.body).toHaveProperty('dadosPessoais');
    expect(res.body.dadosPessoais).toHaveProperty('nome');
    
    expect(res.body).toHaveProperty('questionarios');
    expect(Array.isArray(res.body.questionarios)).toBe(true);
    expect(res.body.questionarios.length).toBeGreaterThan(0);
    
    expect(res.body).toHaveProperty('historicoTrocas');
    expect(Array.isArray(res.body.historicoTrocas)).toBe(true);
    
    // Valida se o histórico agrupado funcionou
    const troca = res.body.historicoTrocas[0];
    expect(troca).toHaveProperty('refeicao', 'Almoço');
    expect(troca.itens[0]).toHaveProperty('status', 'aceito');
  });

  it('GET /api/relatorios/:id/geral - Deve retornar 404 se assistido não existir', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/relatorios/${fakeId}/geral`) 
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Assistido não encontrado.');
  });
});