const db = require('../config/db');

// Define quais respostas consideramos como "alta frequência"
const OPCOES_ALTA_FREQUENCIA = ['2-4x na semana', '5-6x na semana', '1x por dia ou mais'];

async function processarRespostasEGerarAlimentosSeguros(assistidoId) {
  // Adiciona a conexão aqui para podermos fazer rollback se necessário DENTRO do serviço
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN'); // Inicia transação AQUI

    console.log(`(Serviço Processamento) Iniciando para Assistido ID: ${assistidoId}`);

    const questionarioRes = await client.query( // USA client
      `SELECT qr.id FROM questionarios_respondidos qr
       JOIN modelos_questionarios mq ON qr.modelo_questionario_id = mq.id
       WHERE qr.assistido_id = $1 AND mq.nome = 'Frequência Alimentar'
       ORDER BY qr.data_resposta DESC LIMIT 1`,
      [assistidoId]
    );
    console.log('(Serviço Processamento) Resultado busca questionario_respondido:', questionarioRes.rows);
    if (questionarioRes.rows.length === 0) {
      console.warn('(Serviço Processamento) Nenhum questionário QFA encontrado.');
      await client.query('ROLLBACK'); // Rollback seguro
      return [];
    }
    const questionarioId = questionarioRes.rows[0].id;
    console.log(`(Serviço Processamento) Usando questionario_respondido_id: ${questionarioId}`);

    const respostasRes = await client.query( // USA client
      `SELECT r.modelo_pergunta_id
       FROM respostas r
       JOIN modelos_opcoes_respostas mor ON r.modelo_opcao_resposta_id = mor.id
       WHERE r.questionario_respondido_id = $1 AND mor.texto_opcao = ANY($2::text[])`,
      [questionarioId, OPCOES_ALTA_FREQUENCIA]
    );
    console.log('(Serviço Processamento) Resultado busca respostas alta frequência:', respostasRes.rows);
    const perguntasDeAltaFrequenciaIds = respostasRes.rows.map(r => r.modelo_pergunta_id);
    if (perguntasDeAltaFrequenciaIds.length === 0) {
        console.warn('(Serviço Processamento) Nenhuma resposta de alta frequência encontrada.');
        await client.query('ROLLBACK'); // Rollback seguro
        return [];
    }
    console.log('(Serviço Processamento) IDs das perguntas com alta frequência:', perguntasDeAltaFrequenciaIds);

    const alimentosRes = await client.query( // USA client
      `SELECT a.id as alimento_id, a.nome
       FROM alimentos a
       JOIN modelos_perguntas mp ON mp.texto_pergunta ILIKE 'Com que frequência o assistido come ' || lower(a.nome) || '?' -- Força lower() no nome do alimento
       WHERE mp.id = ANY($1::uuid[])`,
       [perguntasDeAltaFrequenciaIds]
    );
    console.log('(Serviço Processamento) Resultado busca alimentos correspondentes:', alimentosRes.rows);
    const alimentosSegurosIds = alimentosRes.rows.map(a => a.alimento_id);
    if (alimentosSegurosIds.length === 0) {
        console.warn('(Serviço Processamento) NENHUM ID de alimento encontrado correspondendo às perguntas.');
        // Não retorna aqui, apenas avisa. O loop de inserção não fará nada.
    }
    console.log('(Serviço Processamento) IDs dos alimentos a serem marcados como seguros:', alimentosSegurosIds);

    let inseridos = 0;
    for (const alimentoId of alimentosSegurosIds) {
      const insertRes = await client.query( // USA client
        'INSERT INTO alimentos_seguros (assistido_id, alimento_id) VALUES ($1, $2) ON CONFLICT (assistido_id, alimento_id) DO NOTHING',
        [assistidoId, alimentoId]
      );
      if (insertRes.rowCount > 0) {
        inseridos++;
      }
    }
    console.log(`(Serviço Processamento) ${inseridos} novos alimentos seguros foram adicionados/confirmados.`);

    await client.query('COMMIT'); // COMMIT AQUI
    return alimentosSegurosIds;

  } catch (error) {
    console.error('(Serviço Processamento) ERRO GERAL:', error);
    // Adiciona log detalhado do erro SQL, se disponível
    if (error.stack) {
        console.error("Stack do Erro:", error.stack);
    }
    try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Erro no rollback:', rbErr); } // Tenta Rollback
    throw error; // Re-lança o erro
  } finally {
      client.release(); // Libera o cliente
  }
}


async function processarRespostasEGerarAlimentosSeguros(assistidoId) {
  try {
    console.log(`(Serviço) Iniciando processamento de alimentos seguros para o Assistido ID: ${assistidoId}`);

    const questionarioRes = await db.query(
      `SELECT qr.id FROM questionarios_respondidos qr
       JOIN modelos_questionarios mq ON qr.modelo_questionario_id = mq.id
       WHERE qr.assistido_id = $1 AND mq.nome = 'Frequência Alimentar'
       ORDER BY qr.data_resposta DESC LIMIT 1`,
      [assistidoId]
    );

    if (questionarioRes.rows.length === 0) {
      console.log('(Serviço) Nenhum questionário de frequência encontrado para este assistido.');
      return;
    }
    const questionarioId = questionarioRes.rows[0].id;

    const respostasRes = await db.query(
      `SELECT r.modelo_pergunta_id FROM respostas r
       JOIN modelos_opcoes_respostas mor ON r.modelo_opcao_resposta_id = mor.id
       WHERE r.questionario_respondido_id = $1 AND mor.texto_opcao = ANY($2::text[])`,
      [questionarioId, OPCOES_ALTA_FREQUENCIA]
    );

    const perguntasDeAltaFrequenciaIds = respostasRes.rows.map(r => r.modelo_pergunta_id);
    if (perguntasDeAltaFrequenciaIds.length === 0) {
        console.log('(Serviço) Nenhum alimento de alta frequência encontrado nas respostas.');
        return;
    }

    const alimentosRes = await db.query(
      `SELECT a.id as alimento_id FROM alimentos a
       JOIN modelos_perguntas mp ON mp.texto_pergunta ILIKE 'Com que frequência o assistido come ' || a.nome || '?'
       WHERE mp.id = ANY($1::uuid[])`,
       [perguntasDeAltaFrequenciaIds]
    );

    const alimentosSegurosIds = alimentosRes.rows.map(a => a.alimento_id);

    let inseridos = 0;
    for (const alimentoId of alimentosSegurosIds) {
      const insertRes = await db.query(
        'INSERT INTO alimentos_seguros (assistido_id, alimento_id) VALUES ($1, $2) ON CONFLICT (assistido_id, alimento_id) DO NOTHING',
        [assistidoId, alimentoId]
      );
      if (insertRes.rowCount > 0) {
        inseridos++;
      }
    }

    console.log(`(Serviço) ${inseridos} novos alimentos seguros foram adicionados.`);
    return alimentosSegurosIds;

  } catch (error) {
    console.error('(Serviço) Erro no serviço de processamento:', error);
  }
  
}

module.exports = { processarRespostasEGerarAlimentosSeguros };