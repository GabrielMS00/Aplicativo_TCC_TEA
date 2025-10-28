// backend/scripts/seed-all-test-data.js
const path = require('path');
// Garante que o .env na raiz do projeto seja carregado
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // Necessário para criar o cuidador
// Importa o serviço que processa as respostas do QFA
const { processarRespostasEGerarAlimentosSeguros } = require('../src/services/processamentoQuestionarioService');

// Define um perfil de consumo simulado para o QFA do assistido de teste.
// Chaves devem corresponder EXATAMENTE ao nome do alimento na tabela `alimentos`.
const perfilSimuladoQFA = {
  'Banana': '1x por dia ou mais',
  'Batata': '5-6x na semana',
  'Maçã': '2-4x na semana',
  'Arroz': '1x por dia ou mais',
  'Frango': '2-4x na semana',
  'Brócolis': 'Nunca',
  'Feijão': '1x na semana', // Frequência baixa, não deve virar seguro
  'Pão': '1x por dia ou mais',
  // Alimentos do QFA não listados aqui receberão 'Nunca' como resposta default.
};

// Dados do Cuidador e Assistido de Teste
const cuidadorTeste = {
    nome: 'Cuidador Teste Seed Contexto', // Nome ajustado para clareza
    email: 'cuidador@teste.com',
    senhaPlain: 'passwordValida123', // Senha em texto plano para hashear
    cpf: '000.000.000-00', // Certifique-se que este CPF é único ou o INSERT falhará
    data_nascimento: '1990-01-01'
};
const assistidoTeste = {
    nome: 'Assistido Teste Seed Contexto', // Nome ajustado
    data_nascimento: '2015-01-01',
};

// Configura a conexão com o banco de dados.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function seedContextoTeste() {
  const client = await pool.connect();
  let assistidoIdParaProcessar = null;

  try {
    console.log('--- Iniciando Seeding de Contexto de Teste (Usuário, Assistido, Respostas QFA) ---');
    await client.query('BEGIN');

    // -- 1. Cuidador de Teste --
    console.log('1. Criando/Verificando Cuidador de Teste...');
    let cuidador = (await client.query("SELECT id FROM cuidadores WHERE email = $1", [cuidadorTeste.email])).rows[0];
    let cuidadorId;
    if (!cuidador) {
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(cuidadorTeste.senhaPlain, salt);
      const cpfCheck = await client.query("SELECT 1 FROM cuidadores WHERE cpf = $1", [cuidadorTeste.cpf]);
      if (cpfCheck.rows.length > 0) {
          console.warn(`   Aviso: CPF ${cuidadorTeste.cpf} já existe. Tentando encontrar cuidador pelo CPF.`);
          cuidador = (await client.query("SELECT id FROM cuidadores WHERE cpf = $1", [cuidadorTeste.cpf])).rows[0];
          if (!cuidador) throw new Error(`CPF ${cuidadorTeste.cpf} existe, mas não foi possível recuperar o ID.`);
          cuidadorId = cuidador.id;
          console.log('   Cuidador encontrado pelo CPF existente.');
      } else {
          const cuidadorRes = await client.query(
            "INSERT INTO cuidadores (nome, email, senha_hash, cpf, data_nascimento) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [cuidadorTeste.nome, cuidadorTeste.email, senhaHash, cuidadorTeste.cpf, cuidadorTeste.data_nascimento]
          );
          cuidadorId = cuidadorRes.rows[0].id;
          console.log('   Cuidador de teste criado com hash real.');
      }
    } else {
      cuidadorId = cuidador.id;
      console.log('   Cuidador de teste já existe (encontrado por email).');
    }

    // -- 2. Assistido de Teste --
    console.log('2. Criando/Verificando Assistido de Teste...');
    let assistido = (await client.query("SELECT id FROM assistidos WHERE nome = $1 AND cuidador_id = $2", [assistidoTeste.nome, cuidadorId])).rows[0];
    if (!assistido) {
      const assistidoRes = await client.query(
        "INSERT INTO assistidos (nome, data_nascimento, cuidador_id) VALUES ($1, $2, $3) RETURNING id",
        [assistidoTeste.nome, assistidoTeste.data_nascimento, cuidadorId]
      );
      assistidoIdParaProcessar = assistidoRes.rows[0].id;
      console.log('   Assistido de teste criado.');
    } else {
      assistidoIdParaProcessar = assistido.id;
      console.log('   Assistido de teste já existe.');
    }

    // -- 3. Respostas Simuladas do QFA --
    console.log('3. Simulando respostas do QFA...');
    const modeloRes = await client.query("SELECT id FROM modelos_questionarios WHERE nome = 'Frequência Alimentar'");
    if (modeloRes.rows.length === 0) throw new Error('Modelo "Frequência Alimentar" não encontrado. Rode o seed de questionários antes.');
    const modeloQuestionarioId = modeloRes.rows[0].id;

    const perguntasRes = await client.query('SELECT id, texto_pergunta FROM modelos_perguntas WHERE modelo_questionario_id = $1', [modeloQuestionarioId]);
    if (perguntasRes.rows.length === 0) throw new Error('Perguntas para "Frequência Alimentar" não encontradas. Rode o seed de questionários antes.');

    const mapaPerguntasQFA = Object.fromEntries(perguntasRes.rows.map(p => [p.texto_pergunta, p.id]));
    const opcoesRes = await client.query('SELECT id, texto_opcao, modelo_pergunta_id FROM modelos_opcoes_respostas WHERE modelo_pergunta_id = ANY($1::uuid[])', [perguntasRes.rows.map(p => p.id)]);
    if (opcoesRes.rows.length === 0) throw new Error('Opções para "Frequência Alimentar" não encontradas. Rode o seed de questionários antes.');

    // Cria um novo registro de questionário respondido
    const questionarioRespondidoRes = await client.query(
        "INSERT INTO questionarios_respondidos (assistido_id, cuidador_id, modelo_questionario_id) VALUES ($1, $2, $3) RETURNING id",
        [assistidoIdParaProcessar, cuidadorId, modeloQuestionarioId]
    );
    const questionarioRespondidoId = questionarioRespondidoRes.rows[0].id;
    console.log(`   Criado registro questionarios_respondidos ID: ${questionarioRespondidoId}`);

    let respostasQFAInseridas = 0;
    for (const perguntaTexto in mapaPerguntasQFA) {
      const perguntaId = mapaPerguntasQFA[perguntaTexto];
      const match = perguntaTexto.match(/come (.+)\?/);
      if (!match) continue;
      const nomeAlimentoCru = match[1];
      const nomeAlimento = nomeAlimentoCru.charAt(0).toUpperCase() + nomeAlimentoCru.slice(1);
      const respostaSimuladaTexto = perfilSimuladoQFA[nomeAlimento] || 'Nunca';
      const opcao = opcoesRes.rows.find(o => o.modelo_pergunta_id === perguntaId && o.texto_opcao === respostaSimuladaTexto);

      if (opcao) {
        await client.query(
          'INSERT INTO respostas (questionario_respondido_id, modelo_pergunta_id, modelo_opcao_resposta_id) VALUES ($1, $2, $3)',
          [questionarioRespondidoId, perguntaId, opcao.id]
        );
        respostasQFAInseridas++;
      } else {
         console.warn(`   Aviso: Opção "${respostaSimuladaTexto}" não encontrada para a pergunta ID ${perguntaId} ("${perguntaTexto}")`);
      }
    }
    console.log(`   ${respostasQFAInseridas} respostas simuladas do QFA inseridas.`);

    // -- COMMIT ANTES DO PROCESSAMENTO --
    await client.query('COMMIT');
    console.log('   Dados de contexto (usuário, assistido, respostas) commitados.');

  } catch (error) {
    console.error('❌ Erro durante o seeding de contexto:', error);
    try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Erro no rollback:', rbErr); }
    process.exit(1);
  } finally {
    client.release();
  }

  // -- 4. Processamento Pós-Seed (Alimentos Seguros) --
  if (assistidoIdParaProcessar) {
      console.log(`4. Processando QFA para gerar Alimentos Seguros para Assistido ID: ${assistidoIdParaProcessar}...`);
      try {
          const alimentosSegurosGerados = await processarRespostasEGerarAlimentosSeguros(assistidoIdParaProcessar);
          console.log(`   Processamento concluído. ${alimentosSegurosGerados?.length || 0} alimentos seguros identificados/inseridos.`);
          console.log('✅ Seeding de Contexto e Processamento Finalizado com Sucesso!');
      } catch (processingError) {
          console.error('❌ Erro durante o processamento pós-seed (Alimentos Seguros):', processingError);
          process.exit(1);
      }
  } else {
       console.error('❌ Não foi possível obter o ID do assistido para processar os alimentos seguros.');
       process.exit(1);
  }

  // Fecha o pool de conexão principal
  await pool.end();
}

// Executa a função de seeding
seedContextoTeste();