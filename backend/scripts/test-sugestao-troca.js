// backend/scripts/test-interativo.js
const path = require('path');
// Carrega o .env da raiz (voltando 2 pastas de /scripts)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Nossos serviços e models
const { montarRefeicaoCompleta } = require('../src/services/sugestaoService');
const { processarRespostasEGerarAlimentosSeguros } = require('../src/services/processamentoQuestionarioService');
const AlimentoSeguro = require('../src/api/models/AlimentoSeguro');
const db = require('../src/config/db');

// Importa o módulo nativo do Node.js para ler o terminal
const readline = require('readline');

// Configura a interface de leitura do terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função auxiliar para fazer perguntas no terminal (usando Promise para async/await)
function perguntar(pergunta) {
  return new Promise(resolve => {
    rl.question(pergunta, resposta => {
      resolve(resposta);
    });
  });
}

/**
 * Função principal que roda a simulação
 */
async function iniciarSimulacao() {
  let assistidoId;
  try {
    console.log('--- INICIANDO SIMULAÇÃO DE TROCA ALIMENTAR ---');
    console.log('(Usando apenas módulos nativos do Node.js)');

    // --- SETUP INICIAL ---
    const assistidoRes = await db.query("SELECT id FROM assistidos WHERE nome = 'Assistido Teste'");
    assistidoId = assistidoRes.rows[0].id;
    console.log(`- Assistido: Assistido Teste (ID: ${assistidoId})`);

    console.log('- Processando questionário para definir alimentos seguros iniciais...');
    await processarRespostasEGerarAlimentosSeguros(assistidoId);

    const refeicoesRes = await db.query('SELECT nome FROM refeicoes');
    const nomesRefeicoes = refeicoesRes.rows.map(r => r.nome);

    // --- TELA 1: ESCOLHER A REFEIÇÃO ---
    console.log('\nRefeições disponíveis:');
    nomesRefeicoes.forEach((nome, index) => {
      console.log(`${index + 1}: ${nome}`);
    });
    
    let escolhaRefeicao = await perguntar('Para qual refeição você quer gerar sugestões? (digite o número): ');
    const refeicaoEscolhida = nomesRefeicoes[parseInt(escolhaRefeicao) - 1];
    if (!refeicaoEscolhida) {
      console.log('Escolha inválida.');
      return;
    }

    let idsPerfisExcluir = []; // Guarda as sugestões já mostradas para não repetir

    // --- LOOP PRINCIPAL (TELA 2 -> TELA 3 -> TELA 2) ---
    while (true) {
      console.log(`\n--- Montando sugestão para: ${refeicaoEscolhida} ---`);

      // --- LÓGICA DO BACK-END (Pedindo a sugestão) ---
      const refeicaoSugerida = await montarRefeicaoCompleta(assistidoId, refeicaoEscolhida, idsPerfisExcluir);

      if (!refeicaoSugerida || refeicaoSugerida.itens.length === 0) {
        console.log('Não foi possível montar uma sugestão de refeição.');
        break;
      }

      // --- TELA 2: MOSTRAR A SUGESTÃO ---
      console.log('\n--- SUGESTÃO DE REFEIÇÃO COMPLETA ---');
      const tabelaFormatada = refeicaoSugerida.itens.map(item => ({
        Grupo: item.grupo_alimentar,
        Alimento: item.alimento,
        Status: item.status,
      }));
      console.table(tabelaFormatada); // console.table é nativo e deixa bonito!

      const itensSugeridos = refeicaoSugerida.itens.filter(item => item.status.startsWith('Sugestão'));

      if (itensSugeridos.length === 0) {
        console.log('\nRefeição completa apenas com alimentos seguros! Parabéns!');
        break;
      }

      idsPerfisExcluir.push(...itensSugeridos.map(item => item.perfilId));

      // --- TELA 3: PEDIR FEEDBACK ---
      console.log('\n--- FEEDBACK DAS SUGESTÕES ---');
      const feedbackAceitos = [];
      for (let i = 0; i < itensSugeridos.length; i++) {
        const item = itensSugeridos[i];
        const resposta = await perguntar(`O assistido aceitou "${item.alimento}"? (s/n): `);
        if (resposta.toLowerCase() === 's') {
          feedbackAceitos.push(item.alimentoId); // Salva o ID do ALIMENTO
        }
      }

      // --- LÓGICA DO BACK-END (Processando o feedback) ---
      if (feedbackAceitos.length > 0) {
        console.log(`\n- Salvando ${feedbackAceitos.length} novo(s) alimento(s) seguro(s)...`);
        for (const alimentoId of feedbackAceitos) {
          await AlimentoSeguro.create(assistidoId, alimentoId);
        }
      }

      const acao = await perguntar('\nDeseja gerar uma nova sugestão ou sair? (digite "nova" ou "sair"): ');
      if (acao.toLowerCase() === 'sair') {
        break; // Encerra o loop
      }
    } // Fim do while loop

  } catch (error) {
    console.error('❌ Erro fatal na simulação:', error);
  } finally {
    console.log('\n--- Simulação concluída ---');
    rl.close(); // Fecha a interface do terminal
    if (db.pool) {
      await db.pool.end();
      console.log('Conexão com o banco encerrada.');
    }
  }
}

iniciarSimulacao();