const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');

const perfilSimulado = {
  'Banana': '1x por dia ou mais',
  'Batata': '5-6x na semana',
  'Maçã': '2-4x na semana',
  'Arroz': '1x por dia ou mais',
  'Frango': '2-4x na semana',
  'Brócolis': 'Nunca',
  'Feijão': '1x na semana',
};

// Configura a conexão com o banco de dados.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function seedRespostas() {
  const client = await pool.connect();
  try {
    console.log('Iniciando seeding de respostas simuladas...');
    await client.query('BEGIN');

    // Garante a existência de um cuidador e assistido de teste.
    let cuidador = (await client.query("SELECT id FROM cuidadores WHERE email = 'cuidador@teste.com'")).rows[0];
    if (!cuidador) {
      const cuidadorRes = await client.query("INSERT INTO cuidadores (nome, email, senha_hash, cpf, data_nascimento) VALUES ('Cuidador Teste', 'cuidador@teste.com', 'hash_fake', '000.000.000-00', '1990-01-01') RETURNING id");
      cuidador = cuidadorRes.rows[0];
    }
    const cuidadorId = cuidador.id;

    let assistido = (await client.query("SELECT id FROM assistidos WHERE nome = 'Assistido Teste' AND cuidador_id = $1", [cuidadorId])).rows[0];
    if (!assistido) {
      const assistidoRes = await client.query("INSERT INTO assistidos (nome, data_nascimento, cuidador_id) VALUES ('Assistido Teste', '2015-01-01', $1) RETURNING id", [cuidadorId]);
      assistido = assistidoRes.rows[0];
    }
    const assistidoId = assistido.id;
    
    // Busca o ID do modelo de questionário de frequência.
    const modeloRes = await client.query("SELECT id FROM modelos_questionarios WHERE nome = 'Frequência Alimentar'");
    if (modeloRes.rows.length === 0) throw new Error('Modelo "Frequência Alimentar" não encontrado.');
    const modeloQuestionarioId = modeloRes.rows[0].id;
    
    // Cria um novo registro de questionário respondido para esta simulação.
    const questionarioRespondidoRes = await client.query("INSERT INTO questionarios_respondidos (assistido_id, cuidador_id, modelo_questionario_id) VALUES ($1, $2, $3) RETURNING id", [assistidoId, cuidadorId, modeloQuestionarioId]);
    const questionarioRespondidoId = questionarioRespondidoRes.rows[0].id;

    // Busca todas as perguntas e opções do modelo para mapeamento.
    const perguntasRes = await client.query('SELECT id, texto_pergunta FROM modelos_perguntas WHERE modelo_questionario_id = $1', [modeloQuestionarioId]);
    const opcoesRes = await client.query('SELECT id, texto_opcao, modelo_pergunta_id FROM modelos_opcoes_respostas');
    
    // Itera sobre as perguntas para inserir as respostas simuladas.
    let respostasInseridas = 0;
    for (const pergunta of perguntasRes.rows) {
      const match = pergunta.texto_pergunta.match(/come (.+)\?/);
      if (!match) continue;
      
      const nomeAlimentoCru = match[1];
      const nomeAlimento = nomeAlimentoCru.charAt(0).toUpperCase() + nomeAlimentoCru.slice(1);
      const respostaSimulada = perfilSimulado[nomeAlimento] || 'Nunca'; // Default para 'Nunca' se não definido no perfil.
      
      const opcao = opcoesRes.rows.find(o => o.modelo_pergunta_id === pergunta.id && o.texto_opcao === respostaSimulada);
      
      if (opcao) {
        await client.query(
          'INSERT INTO respostas (questionario_respondido_id, modelo_pergunta_id, modelo_opcao_resposta_id) VALUES ($1, $2, $3)',
          [questionarioRespondidoId, pergunta.id, opcao.id]
        );
        respostasInseridas++;
      }
    }

    console.log(`${respostasInseridas} respostas simuladas foram inseridas.`);
    await client.query('COMMIT');
    console.log('✅ Seeding de respostas concluído.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding de respostas:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seedRespostas();