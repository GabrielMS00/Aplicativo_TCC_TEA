// backend/src/services/sugestaoService.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const db = require('../config/db');
const AlimentoSeguro = require('../api/models/AlimentoSeguro');

const TEMPLATES_DE_REFEICAO = { //
    'Café da Manhã': ['Frutas', 'Proteínas', 'Cereais e Tubérculos'], //
    'Almoço': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'], //
    'Jantar': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'], //
    'Lanche': ['Frutas', 'Cereais e Tubérculos'], //
};

function calcularScoreSimilaridade(perfilBase, perfilCandidato) {
    let score = 0;
    if (!perfilBase || !perfilCandidato) return 0;
    if (perfilCandidato.textura === perfilBase.textura) score += 4;
    if (perfilCandidato.sabor === perfilBase.sabor) score += 3;
    if (perfilCandidato.cor_predominante === perfilBase.cor_predominante) score += 2;
    if (perfilCandidato.temperatura_servico === perfilBase.temperatura_servico) score += 1;
    return score;
}

async function buscarMelhorCandidatoParaGrupo(perfilBase, grupoAlvo, nomeRefeicao, excluirAlimentoIds = [], excluirPerfilIds = []) {
    if (!perfilBase) return null;

    const query = `
        SELECT
            a.id as alimento_id, a.nome, a.grupo_alimentar,
            ps.id as perfil_id, ps.forma_de_preparo, ps.textura, ps.sabor, ps.cor_predominante, ps.temperatura_servico
        FROM alimentos a
        JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
        JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
        JOIN refeicoes r ON pr.refeicao_id = r.id
        WHERE
            a.grupo_alimentar = $1
            AND r.nome = $2
            AND a.id != $3               -- Não sugerir o próprio alimento base
            AND a.id != ALL(COALESCE($4::uuid[], ARRAY[]::uuid[])) -- Excluir alimentos seguros já usados na refeição
            AND ps.id != ALL(COALESCE($5::uuid[], ARRAY[]::uuid[])) -- Excluir perfis específicos (ex: recusados)
    `;
    // Usar COALESCE para garantir que arrays vazios funcionem corretamente no SQL
    const values = [grupoAlvo, nomeRefeicao, perfilBase.alimento_id, excluirAlimentoIds, excluirPerfilIds];

    try {
        const { rows: candidatos } = await db.query(query, values);
        if (candidatos.length === 0) {
            console.log(`(Service) Nenhum candidato para ${grupoAlvo} em ${nomeRefeicao} (base: ${perfilBase.forma_de_preparo}), excluindo perfis [${excluirPerfilIds.join(',')}]`);
            return null;
        }

        let melhorSugestao = null;
        let maiorScore = -1;

        for (const candidato of candidatos) {
            const score = calcularScoreSimilaridade(perfilBase, candidato);
            if (score > maiorScore) {
                maiorScore = score;
                melhorSugestao = {
                    alimentoId: candidato.alimento_id,
                    perfilId: candidato.perfil_id,
                    nome: candidato.nome,
                    forma_de_preparo: candidato.forma_de_preparo,
                    motivo: `Similaridade: ${score.toFixed(1)}/10 (base: ${perfilBase.nome} ${perfilBase.forma_de_preparo})`,
                    score: score,
                };
            }
        }
        console.log(`(Service) Melhor sugestão para ${grupoAlvo} (base ${perfilBase.nome} ${perfilBase.forma_de_preparo}): ${melhorSugestao?.nome} (${melhorSugestao?.forma_de_preparo}), Score: ${maiorScore}`);
        return melhorSugestao;

    } catch (error) {
        console.error(`(Service) Erro ao buscar candidatos para grupo ${grupoAlvo}:`, error);
        throw error; // Re-lança o erro para ser tratado no controller
    }
}

async function gerarSugestoesPorRefeicao(assistidoId, nomeRefeicao, excluirPerfilIds = []) {
    try {
        const template = TEMPLATES_DE_REFEICAO[nomeRefeicao];
        if (!template) throw new Error(`Refeição "${nomeRefeicao}" inválida.`);

        // 1. Buscar perfis sensoriais dos alimentos seguros adequados para a refeição
        const alimentosSegurosRes = await db.query(
            `SELECT
                a.id as alimento_id, a.nome, a.grupo_alimentar,
                ps.id as perfil_id, ps.forma_de_preparo, ps.textura, ps.sabor, ps.cor_predominante, ps.temperatura_servico
             FROM alimentos_seguros asr
             JOIN alimentos a ON asr.alimento_id = a.id
             JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
             JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
             JOIN refeicoes r ON pr.refeicao_id = r.id
             WHERE asr.assistido_id = $1 AND r.nome = $2`,
            [assistidoId, nomeRefeicao]
        );
        const perfisSegurosParaRefeicao = alimentosSegurosRes.rows;
        const idsAlimentosSeguros = [...new Set(perfisSegurosParaRefeicao.map(p => p.alimento_id))];

        const refeicaoItens = []; // Array que conterá os itens da refeição
        const gruposPreenchidos = new Set();
        const alimentosSegurosUsadosIds = new Set(); // Para não repetir o mesmo alimento seguro

        // 2. Preencher com alimentos seguros primeiro
        for (const grupo of template) {
            if (gruposPreenchidos.has(grupo)) continue; // Grupo já preenchido

            const perfilSeguroDisponivel = perfisSegurosParaRefeicao.find(
                p => p.grupo_alimentar === grupo && !alimentosSegurosUsadosIds.has(p.alimento_id)
            );

            if (perfilSeguroDisponivel) {
                refeicaoItens.push({
                    grupo_alimentar: grupo,
                    alimento: `${perfilSeguroDisponivel.nome} (${perfilSeguroDisponivel.forma_de_preparo})`,
                    status: 'base_segura',
                    alimentoId: perfilSeguroDisponivel.alimento_id,
                    perfilId: perfilSeguroDisponivel.perfil_id,
                    motivo: null, score: null,
                });
                gruposPreenchidos.add(grupo);
                alimentosSegurosUsadosIds.add(perfilSeguroDisponivel.alimento_id);
            }
        }

        // 3. Gerar sugestões para grupos faltantes
        const gruposFaltantes = template.filter(g => !gruposPreenchidos.has(g));

        if (gruposFaltantes.length > 0) {
            if (perfisSegurosParaRefeicao.length === 0) {
                gruposFaltantes.forEach(grupo => {
                    refeicaoItens.push({ grupo_alimentar: grupo, alimento: 'Sem sugestão (base)', status: 'vazio', alimentoId: null, perfilId: null, motivo: null, score: null });
                });
                console.warn(`(Service) Assistido ${assistidoId} sem alimentos seguros para ${nomeRefeicao}.`);
            } else {
                for (const grupoFaltante of gruposFaltantes) {
                    let melhorSugestaoParaGrupo = null;
                    // Tenta encontrar a melhor sugestão baseada em QUALQUER perfil seguro
                    for (const perfilBase of perfisSegurosParaRefeicao) {
                        const sugestao = await buscarMelhorCandidatoParaGrupo(
                            perfilBase, grupoFaltante, nomeRefeicao,
                            idsAlimentosSeguros, // Exclui TODOS os seguros
                            excluirPerfilIds      // Exclui perfis recusados/específicos
                        );
                        if (sugestao && (!melhorSugestaoParaGrupo || sugestao.score > melhorSugestaoParaGrupo.score)) {
                            melhorSugestaoParaGrupo = sugestao;
                        }
                    }

                    if (melhorSugestaoParaGrupo) {
                        refeicaoItens.push({
                            grupo_alimentar: grupoFaltante,
                            alimento: `${melhorSugestaoParaGrupo.nome} (${melhorSugestaoParaGrupo.forma_de_preparo})`,
                            status: 'sugerido',
                            alimentoId: melhorSugestaoParaGrupo.alimentoId,
                            perfilId: melhorSugestaoParaGrupo.perfilId,
                            motivo: melhorSugestaoParaGrupo.motivo,
                            score: melhorSugestaoParaGrupo.score,
                        });
                        excluirPerfilIds.push(melhorSugestaoParaGrupo.perfilId); // Evita sugerir o mesmo perfil de novo na mesma chamada
                        gruposPreenchidos.add(grupoFaltante);
                    } else {
                        refeicaoItens.push({ grupo_alimentar: grupoFaltante, alimento: 'Nenhuma sugestão encontrada', status: 'vazio', alimentoId: null, perfilId: null, motivo: null, score: null });
                    }
                }
            }
        }

        // Ordena final
         refeicaoItens.sort((a, b) => template.indexOf(a.grupo_alimentar) - template.indexOf(b.grupo_alimentar));

        return { refeicao: nomeRefeicao, itens: refeicaoItens };

    } catch (error) {
        console.error('(Service) Erro ao gerar sugestões por refeição:', error);
        throw error; // Propaga o erro
    }
}

async function processarFeedbackESalvarSeguros(assistidoId, feedbackList) {
    const client = await db.pool.connect();
    const perfisRecusadosIds = [];
    try {
        await client.query('BEGIN');

        for (const feedback of feedbackList) {
            const { detalheTrocaId, status, alimentoId, perfilId } = feedback; // Pega IDs do frontend
            if (!['aceito', 'recusado'].includes(status)) continue;

             // Atualiza o status APENAS se ainda for 'sugerido' e pertence ao assistido correto
            const updateRes = await client.query(
                 `UPDATE detalhes_troca SET status = $1
                  WHERE id = $2 AND status = 'sugerido'
                  AND EXISTS (
                     SELECT 1 FROM trocas_alimentares ta
                     WHERE ta.id = detalhes_troca.troca_alimentar_id
                     AND ta.assistido_id = $3
                  )
                  RETURNING id`, // Só precisamos saber se atualizou
                 [status, detalheTrocaId, assistidoId]
             );


            if (updateRes.rowCount > 0) { // Se a atualização ocorreu
                if (status === 'aceito' && alimentoId) {
                    await AlimentoSeguro.create(assistidoId, alimentoId); // Usa o model com ON CONFLICT
                    console.log(`(Service) Alimento aceito ${alimentoId} registrado como seguro para assistido ${assistidoId}.`);
                } else if (status === 'recusado' && perfilId) {
                    perfisRecusadosIds.push(perfilId);
                }
            } else {
                 console.warn(`(Service) Feedback para detalheTrocaId ${detalheTrocaId} não processado (status já era ${status} ou não pertence ao assistido ${assistidoId}).`);
            }
        }

        await client.query('COMMIT');
        console.log(`(Service) Feedback processado. Perfis a excluir na próxima: [${perfisRecusadosIds.join(', ')}]`);
        return perfisRecusadosIds; // Retorna a lista de perfis recusados

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('(Service) Erro ao processar feedback:', error);
        throw error; // Propaga o erro
    } finally {
        client.release();
    }
}

module.exports = {
    gerarSugestoesPorRefeicao,
    processarFeedbackESalvarSeguros
};