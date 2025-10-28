const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');

// Alimentos para o Questionário de Frequência Alimentar (QFA)
const nomesDosAlimentosQFA = [ //
  'Banana', 'Maçã', 'Mamão', 'Uva', 'Melancia', 'Cenoura', 'Abobrinha', //
  'Tomate', 'Brócolis', 'Alface', 'Carne Bovina', 'Frango', 'Ovo', //
  'Feijão', 'Peixe', 'Arroz', 'Macarrão', 'Pão', 'Batata', 'Mandioca', //
  'Leite', 'Iogurte', 'Queijo', 'Biscoito', 'Refrigerante', 'Suco de caixinha' //
];

// Monta a estrutura do QFA dinamicamente
const questionarioQFA = {
  nome: 'Frequência Alimentar', //
  perguntas: nomesDosAlimentosQFA.map(nomeAlimento => ({ //
    texto: `Com que frequência o assistido come ${nomeAlimento.toLowerCase()}?` //
  })),
  opcoes: [ //
    'Nunca', //
    '1x na semana', //
    '2-4x na semana', //
    '5-6x na semana', //
    '1x por dia ou mais', //
  ],
};

// Define os outros questionários estaticamente
const outrosQuestionarios = [
  {
    nome: 'Questionário BAMBI', //
    perguntas: [
      { texto: 'Meu filho(a) se recusa a sentar à mesa na hora das refeições.' }, //
      { texto: 'Meu filho(a) tem crises de birra ou se irrita durante as refeições.' }, //
      { texto: 'Meu filho(a) cospe a comida.' }, //
      { texto: 'Meu filho(a) come menos do que eu acho que deveria.' }, //
      { texto: 'Meu filho(a) aceita uma grande variedade de alimentos.' }, //
      { texto: 'Meu filho(a) come alimentos com certas texturas apenas.' }, //
      { texto: 'Meu filho(a) empurra ou joga comida fora do prato.' }, //
      { texto: 'Meu filho(a) precisa de distrações (celular, brinquedos, televisão) para comer.' }, //
      { texto: 'Meu filho(a) rejeita alimentos apenas pelo cheiro ou aparência.' }, //
      { texto: 'Meu filho(a) recusa alimentos que são misturados ou encostam no prato.' }, //
      { texto: 'Meu filho(a) insiste em rituais ou rotinas específicas para comer.' }, //
      { texto: 'Meu filho(a) aceita alimentos apenas em certas apresentações (formato, temperatura, utensílio).' }, //
      { texto: 'Meu filho(a) come melhor quando está sozinho(a).' }, //
      { texto: 'Meu filho(a) engasga ou vomita durante as refeições.' }, //
    ],
    opcoes: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'], //
  },
  {
    nome: 'STEP-CHILD', //
    perguntas: [
      { texto: 'Recusa alimentos frequentemente.' }, //
      { texto: 'Seletividade alimentar (recusa com base em sabor/textura).' }, //
      { texto: 'Mastigação insuficiente ou ausência de mastigação.' }, //
      { texto: 'Episódios de vômito durante ou após refeições.' }, //
      { texto: 'Engole comida sem mastigar adequadamente.' }, //
      { texto: 'Esconde comida na boca sem engolir (pouching).' }, //
      { texto: 'Bota comida para fora ou cospe alimentos.' }, //
      { texto: 'Alimentação excessivamente lenta.' }, //
      { texto: 'Alimentação excessivamente rápida.' }, //
      { texto: 'A criança se distrai facilmente durante as refeições.' }, //
      { texto: 'Necessita de entretenimento (TV, brinquedos) para comer.' }, //
      { texto: 'Apresenta crises ou comportamentos disruptivos à mesa.' }, //
      { texto: 'Recusa alimentos com base na cor.' }, //
      { texto: 'Recusa alimentos com base na temperatura.' }, //
      { texto: 'Apresenta aversão a certos odores de alimentos.' }, //
      { texto: 'Rouba alimentos de outros pratos ou da cozinha.' }, //
      { texto: 'Dificuldade para aceitar novos alimentos.' }, //
      { texto: 'Frequente engasgo durante as refeições.' }, //
      { texto: 'Não mostra interesse por alimentos.' }, //
      { texto: 'Come em horários inadequados sem supervisão.' }, //
      { texto: 'Alimentação noturna frequente sem fome aparente.' }, //
      { texto: 'Mastiga objetos não comestíveis com frequência.' }, //
      { texto: 'Faz birras quando é apresentada nova comida.' }, //
      { texto: 'Evita alimentos crocantes/secos.' }, //
      { texto: 'Evita alimentos úmidos/molhados.' }, //
      { texto: 'Evita alimentos misturados (ex: arroz com feijão).' }, //
      { texto: 'Tem forte preferência por alimentos doces ou salgados.' }, //
    ],
    opcoes: ['Ausente', '1 a 10 vezes/mês', 'Mais de 10 vezes/mês'], //
  },
  // Adicione outros questionários aqui no futuro, se necessário
];

// Combina todos os questionários em uma única lista
const todosQuestionarios = [questionarioQFA, ...outrosQuestionarios];


// Configura a conexão com o banco de dados.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function seedTodosQuestionarios() {
  const client = await pool.connect();
  try {
    console.log('Iniciando seeding de TODOS os modelos de questionário...');
    await client.query('BEGIN');

    let modelosCriados = 0;
    let perguntasCriadas = 0;
    let opcoesCriadas = 0;

    for (const questionario of todosQuestionarios) {
      // 1. Insere o Modelo do Questionário (se não existir)
      const modeloRes = await client.query(
        'INSERT INTO modelos_questionarios (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING RETURNING id',
        [questionario.nome]
      );

      let modeloId;
      if (modeloRes.rows.length > 0) {
        modeloId = modeloRes.rows[0].id;
        modelosCriados++;
        console.log(`- Modelo "${questionario.nome}" criado/encontrado.`);
      } else {
        const existingModelo = await client.query('SELECT id FROM modelos_questionarios WHERE nome = $1', [questionario.nome]);
        if (existingModelo.rows.length === 0) {
          throw new Error(`Falha ao criar ou encontrar o modelo "${questionario.nome}"`);
        }
        modeloId = existingModelo.rows[0].id;
        console.log(`- Modelo "${questionario.nome}" já existente.`);
      }

      // 2. Insere as Perguntas do Modelo (se não existirem PARA ESTE MODELO)
      for (const pergunta of questionario.perguntas) {
        const checkPergunta = await client.query(
          'SELECT id FROM modelos_perguntas WHERE texto_pergunta = $1 AND modelo_questionario_id = $2',
          [pergunta.texto, modeloId]
        );

        let perguntaId;
        let foiInserida = false;

        if (checkPergunta.rows.length === 0) {
          const perguntaRes = await client.query(
            'INSERT INTO modelos_perguntas (texto_pergunta, modelo_questionario_id) VALUES ($1, $2) RETURNING id',
            [pergunta.texto, modeloId]
          );
          perguntaId = perguntaRes.rows[0].id;
          perguntasCriadas++;
          foiInserida = true;
           console.log(`  - Pergunta "${pergunta.texto.substring(0, 40)}..." criada.`);
        } else {
          perguntaId = checkPergunta.rows[0].id;
           console.log(`  - Pergunta "${pergunta.texto.substring(0, 40)}..." já existente neste modelo.`);
        }

        // 3. Insere as Opções para a Pergunta (APENAS se a pergunta foi recém-inserida)
        if (foiInserida) {
             for (const opcaoTexto of questionario.opcoes) {
               // Verifica se a opção JÁ EXISTE para esta pergunta específica
               const checkOpcao = await client.query(
                 'SELECT id FROM modelos_opcoes_respostas WHERE texto_opcao = $1 AND modelo_pergunta_id = $2',
                 [opcaoTexto, perguntaId]
               );

               if (checkOpcao.rows.length === 0) {
                 await client.query(
                   'INSERT INTO modelos_opcoes_respostas (texto_opcao, modelo_pergunta_id) VALUES ($1, $2)',
                   [opcaoTexto, perguntaId]
                 );
                 opcoesCriadas++;
               }
             }
        }
      }
    }

    await client.query('COMMIT');
    console.log('--- Resumo ---');
    console.log(`${modelosCriados} novos modelos de questionário criados.`);
    console.log(`${perguntasCriadas} novas perguntas criadas.`);
    console.log(`${opcoesCriadas} novas opções de resposta criadas.`);
    console.log('✅ Seeding de todos os questionários concluído.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding dos questionários:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

// Executa a função de seeding
seedTodosQuestionarios();