const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');

// Definição dos dados mestre para o questionário de frequência.
// As perguntas serão geradas dinamicamente a partir desta lista de nomes.
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

// Configura a conexão com o banco de dados utilizando as variáveis de ambiente.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function seedQuestionario() {
  const client = await pool.connect();
  try {
    console.log('Iniciando seeding do modelo de questionário...');
    await client.query('BEGIN');

    // Garante a existência do modelo de questionário e recupera seu ID.
    const questionarioRes = await client.query(
      'INSERT INTO modelos_questionarios (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING RETURNING id',
      [modeloQuestionario.nome]
    );
    const questionarioId = questionarioRes.rows[0]?.id || (await client.query('SELECT id FROM modelos_questionarios WHERE nome = $1', [modeloQuestionario.nome])).rows[0].id;
    
    let perguntasCriadas = 0;
    for (const nomeAlimento of nomesDosAlimentos) {
      const textoPergunta = `Com que frequência o assistido come ${nomeAlimento.toLowerCase()}?`;
      
      // Insere a pergunta se ela não existir, prevenindo duplicatas.
      const perguntaRes = await client.query(
        'INSERT INTO modelos_perguntas (texto_pergunta, modelo_questionario_id) VALUES ($1, $2) ON CONFLICT (texto_pergunta) DO NOTHING RETURNING id',
        [textoPergunta, questionarioId]
      );

      // Se a pergunta foi inserida (não existia antes), popula suas opções de resposta.
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
    
    console.log(`${perguntasCriadas} novas perguntas foram criadas.`);
    await client.query('COMMIT');
    console.log('✅ Seeding de questionário concluído.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding de questionário:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seedQuestionario();