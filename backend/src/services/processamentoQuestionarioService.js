const db = require('../config/db');

// Define quais respostas consideramos como "alta frequência"
const OPCOES_ALTA_FREQUENCIA = ['2-4x na semana', '5-6x na semana', '1x por dia ou mais'];

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