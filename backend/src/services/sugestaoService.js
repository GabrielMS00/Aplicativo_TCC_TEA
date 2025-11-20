// backend/src/services/sugestaoService.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const db = require('../config/db');
const AlimentoSeguro = require('../api/models/AlimentoSeguro');

// --- CONSTANTES E UTILITÁRIOS ---

// Agora que Laticínios viraram Proteínas, o template fica simples.
// A lógica de "grupos flexíveis" não é mais necessária,
// pois o grupo "Proteínas" por si só já é flexível.
const TEMPLATES_DE_REFEICAO = { 
    'Café da Manhã': ['Frutas', 'Proteínas', 'Cereais e Tubérculos'], 
    'Almoço': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'], 
    'Jantar': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'], 
    'Lanche': ['Frutas', 'Cereais e Tubérculos'], 
};

const mapasDeSimilaridade = {
    textura: {
        'Macia': ['Pastosa', 'Cremosa', 'Suculenta', 'Elástica', 'Desfiada', 'Granulada'],
        'Pastosa': ['Macia', 'Cremosa'],
        'Cremosa': ['Macia', 'Pastosa', 'Líquida'],
        'Crocante': ['Seca', 'Firme'],
        'Seca': ['Crocante', 'Granulada'],
        'Firme': ['Crocante', 'Elástica'],
        'Líquida': ['Cremosa', 'Aguada'],
        'Aguada': ['Líquida', 'Suculenta'],
        'Suculenta': ['Macia', 'Aguada'],
        'Granulada': ['Macia', 'Seca'],
        'Fibrosa': ['Firme'],
        'Elástica': ['Firme', 'Macia'],
        'Desfiada': ['Macia', 'Fibrosa'],
    },
    sabor: {
        'Doce': ['Suave'],
        'Salgado': ['Suave'],
        'Ácido': ['Picante', 'Amargo'],
        'Suave': ['Neutro', 'Doce', 'Salgado', 'Aguado'],
        'Neutro': ['Suave', 'Aguado'],
        'Aguado': ['Suave', 'Neutro'],
        'Amargo': ['Ácido'],
        'Picante': ['Ácido'],
    },
};

function calcularScoreSimilaridade(perfilBase, perfilCandidato) {
    let score = 0;
    if (!perfilBase || !perfilCandidato) return 0;

    const base = { textura: perfilBase.textura, sabor: perfilBase.sabor, cor: perfilBase.cor_predominante, temp: perfilBase.temperatura_servico };
    const cand = { textura: perfilCandidato.textura, sabor: perfilCandidato.sabor, cor: perfilCandidato.cor_predominante, temp: perfilCandidato.temperatura_servico };

    if (base.textura === cand.textura) score += 4;
    else if (mapasDeSimilaridade.textura[base.textura]?.includes(cand.textura)) score += 2; 

    if (base.sabor === cand.sabor) score += 3;
    else if (mapasDeSimilaridade.sabor[base.sabor]?.includes(cand.sabor)) score += 1.5; 

    if (base.cor === cand.cor) score += 2;
    if (base.temp === cand.temp) score += 1;
    
    return score;
}

// --- LÓGICA DE BUSCA (CASCATA) ---

/**
 * Tenta encontrar um alimento NOVO ou RECUSADO para sugerir.
 * Retorna NULL se todos os alimentos do grupo já forem 'seguros'.
 */
async function _buscarMelhorCandidatoParaGrupo(perfisBase, grupoAlvo, nomeRefeicao, excluirAlimentoIds = [], excluirPerfilIds = []) {
    
    const temBase = perfisBase && perfisBase.length > 0;

    // === TENTATIVA 1: SIMILARIDADE (Ideal) ===
    if (temBase) {
        const baseIds = perfisBase.map(p => p.alimento_id);
        const baseIdPlaceholders = baseIds.map((_, i) => `$${i + 3}`).join(', ');
        const idxAlimentosExcluir = baseIds.length + 3; 
        const idxPerfisExcluir = baseIds.length + 4; 

        const querySimilar = `
            SELECT
                a.id as "alimento_id", a.nome,
                ps.id as "perfil_id", ps.forma_de_preparo, ps.textura, ps.sabor, ps.cor_predominante, ps.temperatura_servico
            FROM alimentos a
            JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
            JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
            JOIN refeicoes r ON pr.refeicao_id = r.id
            WHERE
                a.grupo_alimentar = $1     
                AND r.nome = $2              
                AND a.id != ANY(ARRAY[${baseIdPlaceholders}]::uuid[]) 
                AND a.id != ALL(COALESCE($${idxAlimentosExcluir}::uuid[], ARRAY[]::uuid[])) 
                AND ps.id != ALL(COALESCE($${idxPerfisExcluir}::uuid[], ARRAY[]::uuid[])) 
        `;
        
        const values = [grupoAlvo, nomeRefeicao, ...baseIds, excluirAlimentoIds, excluirPerfilIds];

        try {
            const { rows: candidatos } = await db.query(querySimilar, values);
            let melhorSugestao = null;
            let maiorScore = 0; 

            for (const candidato of candidatos) {
                let scoreTotalCandidato = 0;
                let melhorMotivo = '';
                
                for (const perfilBase of perfisBase) {
                    let score = calcularScoreSimilaridade(perfilBase, candidato);
                    if (score >= 9.5) score = 7; 

                    if (score > scoreTotalCandidato) {
                        scoreTotalCandidato = score;
                        melhorMotivo = `Similar ao seu alimento seguro: ${perfilBase.nome} (${perfilBase.forma_de_preparo})`;
                    }
                }
                
                if (scoreTotalCandidato > maiorScore) {
                    maiorScore = scoreTotalCandidato;
                    melhorSugestao = {
                        alimentoId: candidato.alimento_id,
                        perfilId: candidato.perfil_id,
                        nome: candidato.nome,
                        forma_de_preparo: candidato.forma_de_preparo,
                        motivo: melhorMotivo,
                        score: maiorScore,
                        status: 'sugerido'
                    };
                }
            }
            if (melhorSugestao) return melhorSugestao;
        } catch (error) {
            console.error(`(Service) Erro na busca por similaridade:`, error.message);
        }
    }
    
    // === TENTATIVA 2: VARIEDADE (Fallback) ===
    try {
        const queryVariedade = `
            SELECT
                a.id as "alimento_id", a.nome,
                ps.id as "perfil_id", ps.forma_de_preparo
            FROM alimentos a
            JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
            JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
            JOIN refeicoes r ON pr.refeicao_id = r.id
            WHERE
                a.grupo_alimentar = $1     
                AND r.nome = $2              
                AND a.id != ALL(COALESCE($3::uuid[], ARRAY[]::uuid[])) -- Exclui Seguros
                AND ps.id != ALL(COALESCE($4::uuid[], ARRAY[]::uuid[])) -- Exclui Recusados
            ORDER BY RANDOM() 
            LIMIT 1;
        `;
        
        const values = [grupoAlvo, nomeRefeicao, excluirAlimentoIds, excluirPerfilIds];
        const { rows } = await db.query(queryVariedade, values);
        
        if (rows.length > 0) {
            const item = rows[0];
            return {
                alimentoId: item.alimento_id,
                perfilId: item.perfil_id,
                nome: item.nome,
                forma_de_preparo: item.forma_de_preparo,
                motivo: 'Sugestão para aumentar a variedade',
                score: 0,
                status: 'sugerido'
            };
        }
    } catch (error) {
        console.error(`(Service) Erro na busca por variedade:`, error.message);
    }

    // === TENTATIVA 3: REPETIÇÃO (Ignora Recusados) ===
    try {
        console.warn(`(Service) Esgotaram-se as novidades para ${grupoAlvo}. Tentando repetição.`);
        const queryRepeticao = `
            SELECT
                a.id as "alimento_id", a.nome,
                ps.id as "perfil_id", ps.forma_de_preparo
            FROM alimentos a
            JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
            JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
            JOIN refeicoes r ON pr.refeicao_id = r.id
            WHERE
                a.grupo_alimentar = $1     
                AND r.nome = $2              
                AND a.id != ALL(COALESCE($3::uuid[], ARRAY[]::uuid[])) -- AINDA exclui Seguros
            ORDER BY RANDOM()
            LIMIT 1;
        `;
        
        const values = [grupoAlvo, nomeRefeicao, excluirAlimentoIds];
        const { rows } = await db.query(queryRepeticao, values);

        if (rows.length > 0) {
            const item = rows[0];
            return {
                alimentoId: item.alimento_id,
                perfilId: item.perfil_id,
                nome: item.nome,
                forma_de_preparo: item.forma_de_preparo,
                motivo: 'Nova tentativa para este alimento',
                score: 0,
                status: 'sugerido'
            };
        }
    } catch (error) {
        console.error(`(Service) Erro na busca por repetição:`, error.message);
    }

    // Se TUDO falhar, retorna null para o orquestrador usar um 'Curinga'.
    return null;
}


// --- ORQUESTRADOR DA REFEIÇÃO ---

async function _gerarSugestoesPorRefeicao(assistidoId, nomeRefeicao, excluirPerfilIds = []) {
    try {
        const template = TEMPLATES_DE_REFEICAO[nomeRefeicao];
        if (!template) throw new Error(`Refeição "${nomeRefeicao}" inválida.`);

        // 1. Carrega os Alimentos Seguros do usuário
        const alimentosSegurosRes = await db.query(
            `SELECT
                a.id as "alimento_id", a.nome, a.grupo_alimentar,
                ps.id as "perfil_id", ps.forma_de_preparo, ps.textura, ps.sabor, ps.cor_predominante, ps.temperatura_servico
             FROM alimentos_seguros asr
             JOIN alimentos a ON asr.alimento_id = a.id
             JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
             WHERE asr.assistido_id = $1`,
            [assistidoId]
        );
        const perfisSegurosBase = alimentosSegurosRes.rows;
        const idsAlimentosSeguros = [...new Set(perfisSegurosBase.map(p => p.alimento_id))];
        
        const perfisParaExcluirNaBusca = [
            ...excluirPerfilIds, 
            ...perfisSegurosBase.map(p => p.perfil_id) 
        ];

        const refeicaoItens = [];
        // Usado para garantir que o mesmo "curinga" não seja usado várias vezes
        const perfisCuringaUsados = new Set(); 

        // 2. Preenche cada slot do template
        for (const grupoParaPreencher of template) {
            
            let perfisDeComparacao = perfisSegurosBase.filter(p => p.grupo_alimentar === grupoParaPreencher);
            if (perfisDeComparacao.length === 0) {
                perfisDeComparacao = perfisSegurosBase; 
            }

            // Tenta as 3 tentativas de busca (Similar > Variedade > Repetição)
            const candidato = await _buscarMelhorCandidatoParaGrupo(
                perfisDeComparacao,    
                grupoParaPreencher,    
                nomeRefeicao,          
                idsAlimentosSeguros,   
                perfisParaExcluirNaBusca      
            );
            
            if (candidato) {
                // SUCESSO: Temos uma sugestão
                refeicaoItens.push({
                    grupo_alimentar: grupoParaPreencher,
                    alimento: `${candidato.nome} (${candidato.forma_de_preparo})`,
                    status: 'sugerido',
                    alimentoId: candidato.alimentoId,
                    perfilId: candidato.perfilId,
                    motivo: candidato.motivo,
                    score: candidato.score,
                });
                perfisParaExcluirNaBusca.push(candidato.perfilId);

            } else {
                // === TENTATIVA 4: O "CURINGA" DA BASE SEGURA ===
                // Não achamos nada novo ou repetível.
                // Preenchemos com um alimento da base segura para NUNCA ficar vazio.

                // Prioridade 1: Um seguro do MESMO grupo que ainda não foi usado nesta refeição
                let seguroCuringa = perfisSegurosBase.find(
                    p => p.grupo_alimentar === grupoParaPreencher &&
                         !perfisCuringaUsados.has(p.perfil_id)
                );
                
                // Prioridade 2: Se não achou (ou já usou todos), pega QUALQUER seguro de QUALQUER grupo
                if (!seguroCuringa) {
                    seguroCuringa = perfisSegurosBase.find(p => !perfisCuringaUsados.has(p.perfil_id));
                }

                // Prioridade 3: Se já usou TODOS os seguros, apenas repete o primeiro da lista
                if (!seguroCuringa && perfisSegurosBase.length > 0) {
                    seguroCuringa = perfisSegurosBase[0];
                }

                if (seguroCuringa) {
                    refeicaoItens.push({
                        grupo_alimentar: grupoParaPreencher, // Mantém o grupo do SLOT
                        alimento: `${seguroCuringa.nome} (${seguroCuringa.forma_de_preparo})`,
                        status: 'base_segura', 
                        alimentoId: seguroCuringa.alimento_id,
                        perfilId: seguroCuringa.perfil_id,
                        motivo: 'Alimento da sua base segura (manutenção)',
                        score: null, 
                    });
                    perfisCuringaUsados.add(seguroCuringa.perfil_id); // Marca como "usado"
                } else {
                    // CASO IMPOSSÍVEL (a menos que o banco esteja 100% vazio e QFA não respondido)
                    // O usuário não tem NENHUM alimento seguro.
                    // O _buscarMelhorCandidatoParaGrupo já terá retornado uma sugestão (Tentativa 2 ou 3)
                    // pois a lista de 'excluirAlimentoIds' estaria vazia.
                    // Esta parte é uma defesa final que nunca deve ser atingida.
                    refeicaoItens.push({ 
                        grupo_alimentar: grupoParaPreencher, 
                        alimento: 'Sem opções disponíveis', 
                        status: 'vazio', 
                        alimentoId: null, perfilId: null, motivo: 'Responda o questionário inicial.', score: null 
                    });
                }
            }
        } 

        return { refeicao: nomeRefeicao, itens: refeicaoItens };

    } catch (error) {
        console.error('(Service) Erro crítico ao gerar sugestões:', error);
        throw error; 
    }
}

// --- FUNÇÕES AUXILIARES (PERSISTÊNCIA E FEEDBACK) ---

async function _buscarHistoricoDeRecusa(assistidoId, nomeRefeicao, client) {
    const runner = client || db; 
    const recusaRes = await runner.query(
        `SELECT dt.perfil_sensorial_id FROM detalhes_troca dt
         JOIN trocas_alimentares ta ON dt.troca_alimentar_id = ta.id
         WHERE ta.assistido_id = $1 AND ta.refeicao = $2 AND dt.status = 'recusado'
         AND dt.perfil_sensorial_id IS NOT NULL`,
        [assistidoId, nomeRefeicao]
    );
    return recusaRes.rows.map(r => r.perfil_sensorial_id);
}

async function getUltimaSugestaoAtiva(assistidoId, nomeRefeicao) {
    const client = await db.pool.connect();
    try {
        // Busca a última troca gerada para essa refeição
        const trocaRes = await client.query(
            `SELECT id FROM trocas_alimentares
             WHERE assistido_id = $1 AND refeicao = $2
             ORDER BY data_sugestao DESC LIMIT 1`,
            [assistidoId, nomeRefeicao]
        );

        if (trocaRes.rows.length === 0) return null; 
        const trocaAlimentarId = trocaRes.rows[0].id;

        // Busca os detalhes (itens) dessa troca
        const detalhesRes = await client.query(
            `SELECT d.id as "detalheTrocaId", d.status, d.motivo_sugestao as motivo, d.perfil_sensorial_id as "perfilId",
                    a.id as "alimentoId", a.nome, a.grupo_alimentar, p.forma_de_preparo
             FROM detalhes_troca d
             LEFT JOIN perfis_sensoriais p ON d.perfil_sensorial_id = p.id
             LEFT JOIN alimentos a ON p.alimento_id = a.id OR d.alimento_novo_id = a.id
             WHERE d.troca_alimentar_id = $1`,
            [trocaAlimentarId]
        );

        if (detalhesRes.rows.length === 0) return null;

        // Se ALGUM item já foi avaliado (aceito/recusado), essa sugestão "venceu".
        const feedbackDado = detalhesRes.rows.some(item => item.status === 'aceito' || item.status === 'recusado');
        if (feedbackDado) return null;

        // Formata para o frontend
        const itens = detalhesRes.rows.map(item => ({
            grupo_alimentar: item.grupo_alimentar || 'N/A',
            alimento: item.nome ? `${item.nome} (${item.forma_de_preparo || 'Natural'})` : 'Item não identificado',
            status: item.status, 
            alimentoId: item.alimentoId,
            perfilId: item.perfilId,
            motivo: item.motivo,
            score: null, 
            detalheTrocaId: item.detalheTrocaId,
        }));
        
        // Ordena conforme o template para exibição correta
        const template = TEMPLATES_DE_REFEICAO[nomeRefeicao];
        if (template) {
            itens.sort((a, b) => (template.indexOf(a.grupo_alimentar) || 0) - (template.indexOf(b.grupo_alimentar) || 0));
        }

        return { refeicao: nomeRefeicao, trocaAlimentarId, itens };

    } catch (error) {
        console.error('Erro ao buscar última sugestão ativa:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function gerarESalvarSugestao(assistidoId, nomeRefeicao, client) {
    const runner = client || db.pool;
    
    // 1. Histórico de recusas para tentar não repetir (nas primeiras tentativas)
    const perfisRecusadosIds = await _buscarHistoricoDeRecusa(assistidoId, nomeRefeicao, runner);

    // 2. Gera a sugestão em memória
    const sugestaoGerada = await _gerarSugestoesPorRefeicao(assistidoId, nomeRefeicao, perfisRecusadosIds);

    // Validação final de segurança (não deve acontecer com a nova lógica)
    if (!sugestaoGerada || sugestaoGerada.itens.length === 0) return null;

    // 3. Persiste no banco
    const isInternalTransaction = !client;
    const dbClient = client || await db.pool.connect();
    
    try {
        if (isInternalTransaction) await dbClient.query('BEGIN'); 

        const trocaRes = await dbClient.query(
            'INSERT INTO trocas_alimentares (refeicao, assistido_id) VALUES ($1, $2) RETURNING id',
            [nomeRefeicao, assistidoId]
        );
        const trocaAlimentarId = trocaRes.rows[0].id;

        const insertPromises = sugestaoGerada.itens.map(item =>
            dbClient.query(
                `INSERT INTO detalhes_troca
                 (troca_alimentar_id, alimento_novo_id, perfil_sensorial_id, status, motivo_sugestao)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [trocaAlimentarId, item.alimentoId, item.perfilId, item.status, item.motivo]
            )
        );
        const insertedDetails = await Promise.all(insertPromises);

        if (isInternalTransaction) await dbClient.query('COMMIT'); 

        // Retorna objeto completo com IDs gerados
        return {
            ...sugestaoGerada,
            trocaAlimentarId: trocaAlimentarId,
            itens: sugestaoGerada.itens.map((item, index) => ({
                ...item,
                detalheTrocaId: insertedDetails[index].rows[0].id,
            }))
        };

    } catch (dbError) {
        if (isInternalTransaction) await dbClient.query('ROLLBACK'); 
        console.error('Erro no Serviço ao salvar sugestão:', dbError);
        throw dbError; 
    } finally {
        if (isInternalTransaction) dbClient.release(); 
    }
}

async function processarFeedbackESalvarSeguros(assistidoId, feedbackList, client) {
    try {
        for (const feedback of feedbackList) {
            const { detalheTrocaId, status, alimentoId } = feedback;
            // O feedback agora só vem com 'aceito' ou 'recusado'
            if (!['aceito', 'recusado'].includes(status)) continue;

            // Atualiza o status no histórico
            const updateRes = await client.query(
                 `UPDATE detalhes_troca SET status = $1
                  WHERE id = $2 AND (status = 'sugerido' OR status = 'base_segura')
                  AND EXISTS (
                     SELECT 1 FROM trocas_alimentares ta
                     WHERE ta.id = detalhes_troca.troca_alimentar_id
                     AND ta.assistido_id = $3
                  )
                  RETURNING id`,
                 [status, detalheTrocaId, assistidoId]
             );

            // Atualiza a lista de alimentos seguros
            if (updateRes.rowCount > 0) { 
                if (status === 'aceito' && alimentoId) {
                    await AlimentoSeguro.create(assistidoId, alimentoId, client); 
                } else if (status === 'recusado' && alimentoId) {
                    await AlimentoSeguro.delete(assistidoId, alimentoId, client); 
                }
            }
        }
    } catch (error) {
        console.error('(Service) Erro ao processar feedback:', error);
        throw error;
    }
}

async function processarFeedbackESalvarNovaSugestao(assistidoId, nomeRefeicao, feedback) {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Aplica o feedback (APENAS para 'aceito' e 'recusado')
        await processarFeedbackESalvarSeguros(assistidoId, feedback, client);
        // 2. Gera nova sugestão
        const novaSugestao = await gerarESalvarSugestao(assistidoId, nomeRefeicao, client);
        await client.query('COMMIT');
        return novaSugestao;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('(Service) Erro ao processar e gerar nova:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    // Funções públicas que o Controller irá chamar
    getUltimaSugestaoAtiva,
    gerarESalvarSugestao,
    processarFeedbackESalvarNovaSugestao
};