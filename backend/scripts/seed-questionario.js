const { Pool } = require('pg');

// --- DADOS PARA O QUESTIONÁRIO ---

// A lista de nomes de alimentos que usaremos para gerar as perguntas.
const nomesDosAlimentos = [
  'Banana', 'Maçã', 'Mamão', 'Uva', 'Melancia', 'Cenoura', 'Abobrinha',
  'Tomate', 'Brócolis', 'Alface', 'Carne Bovina', 'Frango', 'Ovo',
  'Feijão', 'Peixe', 'Arroz', 'Macarrão', 'Pão', 'Batata', 'Mandioca',
  'Leite', 'Iogurte', 'Queijo', 'Biscoito', 'Refrigerante', 'Suco de caixinha'
];

const modeloQuestionario = {
  nome: 'Frequência Alimentar',
  opcoesResposta: [
    'Nunca',
    '1x na semana',
    '2-4x na semana',
    '5-6x na semana',
    '1x por dia ou mais',
  ],
};

// --- LÓGICA DO SCRIPT ---

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'tea_app_db',
  user: 'admin',
  password: 'Caio12082000', // <-- ATENÇÃO NESTA LINHA, adicionar senha do banco do .env! 
  });

async function seedQuestionario() {
  const client = await pool.connect();
  try {
    console.log('Iniciando o seeding do questionário de frequência...');
    await client.query('BEGIN');

    // 1. INSERE O MODELO DO QUESTIONÁRIO
    console.log('Verificando/Inserindo modelo de questionário...');
    const questionarioRes = await client.query(
      'INSERT INTO modelos_questionarios (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING RETURNING id',
      [modeloQuestionario.nome]
    );
    // Se o questionário já existe, busca o ID dele
    const questionarioId = questionarioRes.rows[0]?.id || (await client.query('SELECT id FROM modelos_questionarios WHERE nome = $1', [modeloQuestionario.nome])).rows[0].id;
    console.log(`Usando o modelo de questionário com ID: ${questionarioId}`);

    // 2. INSERE AS PERGUNTAS E OPÇÕES DE RESPOSTA
    console.log('Inserindo perguntas e opções de resposta...');
    let perguntasCriadas = 0;
    for (const nomeAlimento of nomesDosAlimentos) {
      const textoPergunta = `Com que frequência o assistido come ${nomeAlimento.toLowerCase()}?`;

      // Insere a pergunta e já pega o ID de volta, sem inserir se já existir
      const perguntaRes = await client.query(
        'INSERT INTO modelos_perguntas (texto_pergunta, modelo_questionario_id) VALUES ($1, $2) ON CONFLICT (texto_pergunta) DO NOTHING RETURNING id',
        [textoPergunta, questionarioId]
      );

      // Se a pergunta foi criada agora (não existia antes), adiciona as opções.
      if (perguntaRes.rows[0]) {
        perguntasCriadas++;
        const perguntaId = perguntaRes.rows[0].id;
        for (const opcao of modeloQuestionario.opcoesResposta) {
          await client.query(
            'INSERT INTO modelos_opcoes_respostas (texto_opcao, modelo_pergunta_id) VALUES ($1, $2)',
            [opcao, perguntaId]
          );
        }
      }
    }
    console.log(`${perguntasCriadas} novas perguntas foram criadas com suas respectivas opções.`);

    await client.query('COMMIT');
    console.log('✅ Seeding do questionário concluído com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding do questionário:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seedQuestionario();