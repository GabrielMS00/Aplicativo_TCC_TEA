const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const db = require('../config/db');

const TEMPLATES_DE_REFEICAO = {
  'Café da Manhã': ['Frutas', 'Proteínas', 'Cereais e Tubérculos'],
  'Almoço': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'],
  'Jantar': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'],
  'Lanche': ['Frutas', 'Cereais e Tubérculos'],
};

/**
 * Função auxiliar que busca candidatos e calcula o melhor score de similaridade sensorial.
 * @param {Array} perfisBase - Perfis do alimento de origem.
 * @param {Array} candidatos - Perfis de alimentos candidatos já filtrados.
 * @returns {Object | null} A melhor sugestão encontrada ou null.
 */
function encontrarMelhorScore(perfisBase, candidatos) {
  let melhorSugestao = null;
  let maiorScore = 0;

  for (const perfilBase of perfisBase) {
    for (const candidato of candidatos) {
      let score = 0;
      if (candidato.textura === perfilBase.textura) score += 4;
      if (candidato.sabor === perfilBase.sabor) score += 3;
      if (candidato.cor_predominante === perfilBase.cor_predominante) score += 2;
      if (candidato.temperatura_servico === perfilBase.temperatura_servico) score += 1;

      if (score > maiorScore) {
        maiorScore = score;
        melhorSugestao = {
          alimentoId: candidato.id,
          perfilId: candidato.perfil_id,
          nome: candidato.nome,
          forma_de_preparo: candidato.forma_de_preparo,
          motivo: `Similaridade alta (Score: ${score}, baseado em ${perfilBase.forma_de_preparo})`,
          score,
        };
      }
    }
  }
  return melhorSugestao;
}

/**
 * Gera UMA sugestão de troca para um alimento base, priorizando variação gradual.
 * @param {string} assistidoId - O ID do assistido.
 * @param {string} alimentoBaseId - O ID do alimento seguro usado como referência sensorial.
 * @param {string} nomeRefeicao - O nome da refeição.
 * @param {string} grupoAlvo - O grupo alimentar específico onde buscar a sugestão.
 * @param {Array<string>} idsParaExcluir - IDs de ALIMENTOS a serem excluídos da busca.
 * @returns {Promise<Object | null>} Um objeto com a sugestão ou null.
 */
async function gerarSugestaoParaGrupo(assistidoId, alimentoBaseId, nomeRefeicao, grupoAlvo, idsParaExcluir = []) {
  try {
    const perfisBaseRes = await db.query('SELECT * FROM perfis_sensoriais WHERE alimento_id = $1', [alimentoBaseId]);
    if (perfisBaseRes.rows.length === 0) return null;
    const perfisDoAlimentoBase = perfisBaseRes.rows;

    const candidatosRes = await db.query(
      `SELECT
          a.id, a.nome, a.grupo_alimentar,
          ps.id as perfil_id, ps.forma_de_preparo, ps.textura, ps.sabor, ps.cor_predominante, ps.temperatura_servico
       FROM alimentos a
       JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
       JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
       JOIN refeicoes r ON pr.refeicao_id = r.id
       WHERE a.grupo_alimentar = $1 AND r.nome = $2 AND a.id != ALL($3::uuid[])`,
      [grupoAlvo, nomeRefeicao, idsParaExcluir]
    );
    const candidatos = candidatosRes.rows;
    if (candidatos.length === 0) return null;

    let sugestaoEncontrada = null;
    for (const perfilBase of perfisDoAlimentoBase) {
      for (const candidato of candidatos) {
        const diff = (candidato.textura !== perfilBase.textura ? 1 : 0) +
                     (candidato.sabor !== perfilBase.sabor ? 1 : 0) +
                     (candidato.cor_predominante !== perfilBase.cor_predominante ? 1 : 0);
        if (diff === 1) {
          sugestaoEncontrada = { alimentoId: candidato.id, perfilId: candidato.perfil_id, nome: candidato.nome, forma_de_preparo: candidato.forma_de_preparo, motivo: `Variação leve (mudou 1 característica de ${perfilBase.forma_de_preparo})` };
          break;
        }
      }
      if (sugestaoEncontrada) break;

       if (!sugestaoEncontrada) {
         for (const candidato of candidatos) {
           const diff = (candidato.textura !== perfilBase.textura ? 1 : 0) +
                        (candidato.sabor !== perfilBase.sabor ? 1 : 0) +
                        (candidato.cor_predominante !== perfilBase.cor_predominante ? 1 : 0);
           if (diff === 2) {
             sugestaoEncontrada = { alimentoId: candidato.id, perfilId: candidato.perfil_id, nome: candidato.nome, forma_de_preparo: candidato.forma_de_preparo, motivo: `Variação moderada (mudou 2 características de ${perfilBase.forma_de_preparo})` };
             break;
           }
         }
       }
       if (sugestaoEncontrada) break;
    }

    if (!sugestaoEncontrada) {
      sugestaoEncontrada = encontrarMelhorScore(perfisDoAlimentoBase, candidatos);
      if (sugestaoEncontrada) {
        sugestaoEncontrada.motivo = `Melhor similaridade geral (Score: ${sugestaoEncontrada.score})`;
      }
    }
    return sugestaoEncontrada;
  } catch (error) {
    console.error(`Erro ao gerar sugestão para grupo ${grupoAlvo}:`, error);
    return null;
  }
}


async function gerarSugestoes(assistidoId, alimentoBaseId, nomeRefeicao, idsParaExcluir = []) {
  try {
    const alimentoBaseRes = await db.query('SELECT * FROM alimentos WHERE id = $1', [alimentoBaseId]);
    if (alimentoBaseRes.rows.length === 0) throw new Error('Alimento base não encontrado.');
    const alimentoBase = alimentoBaseRes.rows[0];
    
    const perfisBaseRes = await db.query('SELECT * FROM perfis_sensoriais WHERE alimento_id = $1', [alimentoBaseId]);
    const perfisDoAlimentoBase = perfisBaseRes.rows;

    const alimentosSegurosRes = await db.query('SELECT alimento_id FROM alimentos_seguros WHERE assistido_id = $1', [assistidoId]);
    let idsAlimentosASeremExcluidos = alimentosSegurosRes.rows.map(row => row.alimento_id);
    idsAlimentosASeremExcluidos.push(alimentoBaseId, ...idsParaExcluir);

    // Tentativa 1: Mesmo Grupo
    let candidatosRes = await db.query(
      `SELECT a.id, a.nome, ps.id as perfil_id, ps.forma_de_preparo, ps.textura, ps.sabor, ps.cor_predominante, ps.temperatura_servico FROM alimentos a
       JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
       JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
       JOIN refeicoes r ON pr.refeicao_id = r.id
       WHERE a.grupo_alimentar = $1 AND r.nome = $2 AND a.id != ALL($3::uuid[])`,
      [alimentoBase.grupo_alimentar, nomeRefeicao, idsAlimentosASeremExcluidos]
    );
    let sugestaoEncontrada = encontrarMelhorScore(perfisDoAlimentoBase, candidatosRes.rows);

    // Tentativa 2: Outros Grupos
    if (!sugestaoEncontrada || sugestaoEncontrada.score < 5) {
      candidatosRes = await db.query(
        `SELECT a.id, a.nome, ps.id as perfil_id, ps.forma_de_preparo, ps.textura, ps.sabor, ps.cor_predominante, ps.temperatura_servico FROM alimentos a
         JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
         JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
         JOIN refeicoes r ON pr.refeicao_id = r.id
         WHERE a.grupo_alimentar != $1 AND r.nome = $2 AND a.id != ALL($3::uuid[])`,
        [alimentoBase.grupo_alimentar, nomeRefeicao, idsAlimentosASeremExcluidos]
      );
      sugestaoEncontrada = encontrarMelhorScore(perfisDoAlimentoBase, candidatosRes.rows);
      if (sugestaoEncontrada) {
        sugestaoEncontrada.motivo = `Sugestão de grupo diferente (Score: ${sugestaoEncontrada.score})`;
      }
    }
    return sugestaoEncontrada;
  } catch (error) {
    console.error('Erro no serviço de sugestão:', error);
    return null;
  }
}

async function montarRefeicaoCompleta(assistidoId, nomeRefeicao, idsPerfisExcluir = []) {
  try {
    const template = TEMPLATES_DE_REFEICAO[nomeRefeicao];
    if (!template) throw new Error(`Refeição "${nomeRefeicao}" inválida.`);

    const alimentosSegurosRes = await db.query(
      `SELECT DISTINCT a.id, a.nome, a.grupo_alimentar, ps.id as perfil_id, ps.forma_de_preparo
       FROM alimentos_seguros asr
       JOIN alimentos a ON asr.alimento_id = a.id
       JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
       JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
       JOIN refeicoes r ON pr.refeicao_id = r.id
       WHERE asr.assistido_id = $1 AND r.nome = $2`,
      [assistidoId, nomeRefeicao]
    );
    const alimentosSeguros = alimentosSegurosRes.rows;

    const refeicaoMontada = { refeicao: nomeRefeicao, itens: [] };
    const gruposJaPresentes = new Set();
    const idsAlimentosSegurosNaRefeicao = [];

    for (const grupo of template) {
      const alimentoSeguroParaOGrupo = alimentosSeguros.find(a => a.grupo_alimentar === grupo && !gruposJaPresentes.has(grupo));
      if (alimentoSeguroParaOGrupo) {
        refeicaoMontada.itens.push({
          grupo_alimentar: grupo,
          alimento: `${alimentoSeguroParaOGrupo.nome} (${alimentoSeguroParaOGrupo.forma_de_preparo})`,
          status: 'Seguro',
          alimentoId: alimentoSeguroParaOGrupo.id,
          perfilId: alimentoSeguroParaOGrupo.perfil_id,
        });
        gruposJaPresentes.add(grupo);
        idsAlimentosSegurosNaRefeicao.push(alimentoSeguroParaOGrupo.id);
      }
    }

    const gruposFaltantes = template.filter(g => !gruposJaPresentes.has(g));

    if (gruposFaltantes.length > 0 && alimentosSeguros.length > 0) {
      const alimentoBase = alimentosSeguros[0];

      for (const grupoFaltante of gruposFaltantes) {
        const todosOsIdsParaExcluir = [...idsAlimentosSegurosNaRefeicao];
        if (idsPerfisExcluir.length > 0) {
           const perfisExcluidosRes = await db.query('SELECT alimento_id FROM perfis_sensoriais WHERE id = ANY($1::uuid[])', [idsPerfisExcluir]);
           todosOsIdsParaExcluir.push(...perfisExcluidosRes.rows.map(p => p.alimento_id));
        }

        const sugestao = await gerarSugestaoParaGrupo(assistidoId, alimentoBase.id, nomeRefeicao, grupoFaltante, [...new Set(todosOsIdsParaExcluir)]);

        if (sugestao) {
          refeicaoMontada.itens.push({
            grupo_alimentar: grupoFaltante,
            alimento: `${sugestao.nome} (${sugestao.forma_de_preparo})`,
            status: `Sugestão (${sugestao.motivo})`,
            alimentoId: sugestao.alimentoId,
            perfilId: sugestao.perfilId,
          });
          idsPerfisExcluir.push(sugestao.perfilId);
        } else {
           refeicaoMontada.itens.push({ grupo_alimentar: grupoFaltante, alimento: 'Nenhuma sugestão encontrada', status: 'Vazio' });
        }
      }
    } else if (gruposFaltantes.length > 0) {
        gruposFaltantes.forEach(grupo => {
            refeicaoMontada.itens.push({ grupo_alimentar: grupo, alimento: 'Nenhuma sugestão (sem base)', status: 'Vazio' });
        });
    }

    return refeicaoMontada;
  } catch (error) {
    console.error('Erro ao montar refeição completa:', error);
    return null;
  }
}

module.exports = { gerarSugestoes, montarRefeicaoCompleta };