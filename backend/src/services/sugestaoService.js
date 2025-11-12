const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const db = require('../config/db');
const AlimentoSeguro = require('../api/models/AlimentoSeguro');

// Define os "slots" de cada refeição
const TEMPLATES_DE_REFEICAO = { 
    'Café da Manhã': ['Frutas', 'Proteínas', 'Cereais e Tubérculos'], 
    'Almoço': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'], 
    'Jantar': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes'], 
    'Lanche': ['Frutas', 'Cereais e Tubérculos'], 
};


// Mapas de similaridade para texturas e sabores
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

// Função de pontuação de similaridade (Score: 0-10)
function calcularScoreSimilaridade(perfilBase, perfilCandidato) {
    let score = 0;
    if (!perfilBase || !perfilCandidato) return 0;

    const base = {
        textura: perfilBase.textura,
        sabor: perfilBase.sabor,
        cor: perfilBase.cor_predominante,
        temp: perfilBase.temperatura_servico
    };
    const cand = {
        textura: perfilCandidato.textura,
        sabor: perfilCandidato.sabor,
        cor: perfilCandidato.cor_predominante,
        temp: perfilCandidato.temperatura_servico
    };

    // Textura (Peso 4)
    if (base.textura === cand.textura) score += 4;
    else if (mapasDeSimilaridade.textura[base.textura]?.includes(cand.textura)) score += 2; 

    // Sabor (Peso 3)
    if (base.sabor === cand.sabor) score += 3;
    else if (mapasDeSimilaridade.sabor[base.sabor]?.includes(cand.sabor)) score += 1.5; 

    // Cor (Peso 2)
    if (base.cor === cand.cor) score += 2;

    // Temperatura (Peso 1)
    if (base.temp === cand.temp) score += 1;
    
    return score;
}

// Busca o melhor candidato (novo alimento)
async function _buscarMelhorCandidatoParaGrupo(perfisBase, grupoAlvo, nomeRefeicao, excluirAlimentoIds = [], excluirPerfilIds = []) {
    if (!perfisBase || perfisBase.length === 0) return null;

    // CORREÇÃO: Os placeholders dos baseIds precisam começar em $3
    const baseIds = perfisBase.map(p => p.alimento_id);
    const baseIdPlaceholders = baseIds.map((_, i) => `$${i + 3}`).join(', '); // Inicia em $3

    // CORREÇÃO: Os próximos placeholders são +3, não +4 ou +5
    const idxAlimentosExcluir = baseIds.length + 3; // $3, $4... $N
    const idxPerfisExcluir = baseIds.length + 4;  // $N+1

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
            AND a.id != ANY(ARRAY[${baseIdPlaceholders}]::uuid[]) -- 3. Não é nenhum dos alimentos base
            AND a.id != ALL(COALESCE($${idxAlimentosExcluir}::uuid[], ARRAY[]::uuid[])) -- 4. Não é um alimento já seguro
            AND ps.id != ALL(COALESCE($${idxPerfisExcluir}::uuid[], ARRAY[]::uuid[])) -- 5. Não é um perfil já recusado
    `;
    
    // Montagem dos valores
    const values = [grupoAlvo, nomeRefeicao, ...baseIds, excluirAlimentoIds, excluirPerfilIds];

    try {
        const { rows: candidatos } = await db.query(querySimilar, values);
        
        let melhorSugestao = null;
        let maiorScore = 0; 

        if (candidatos.length > 0) {
            for (const candidato of candidatos) {
                let scoreTotalCandidato = 0;
                let melhorMotivo = '';
                
                for (const perfilBase of perfisBase) {
                    let score = calcularScoreSimilaridade(perfilBase, candidato);
                    if (score >= 9.5) score = 7; // Penaliza perfis idênticos ou quase idênticos

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
                    };
                }
            }
        }
        
        if (melhorSugestao) {
            return melhorSugestao;
        }

        const queryFallback = `
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
                AND a.id != ALL(COALESCE($3::uuid[], ARRAY[]::uuid[])) -- Exclui alimentos seguros
                AND ps.id != ALL(COALESCE($4::uuid[], ARRAY[]::uuid[])) -- Exclui perfis recusados
            LIMIT 1;
        `;
        
        // CORREÇÃO: Valores corretos para o fallback
        const valuesFallback = [grupoAlvo, nomeRefeicao, excluirAlimentoIds, excluirPerfilIds];
        const { rows: fallbackCandidatos } = await db.query(queryFallback, valuesFallback);
        
        if (fallbackCandidatos.length > 0) {
            const fallback = fallbackCandidatos[0];
            return {
                alimentoId: fallback.alimento_id,
                perfilId: fallback.perfil_id,
                nome: fallback.nome,
                forma_de_preparo: fallback.forma_de_preparo,
                motivo: 'Sugestão para aumentar a variedade',
                score: 0,
            };
        }

        return null;

    } catch (error) {
        // Log detalhado do erro
        console.error(`(Service) Erro fatal ao buscar candidatos para ${grupoAlvo}:`, error.message);
        // console.error("Query Values:", JSON.stringify(values, null, 2)); // Descomente para debug pesado
        throw error; // Lança o erro para o controller (que vai retornar 500)
    }
}


 // Busca o histórico de TODOS os perfis já recusados

async function _buscarHistoricoDeRecusa(assistidoId, nomeRefeicao, client) {
    const runner = client || db; 
    
    const recusaRes = await runner.query(
        `SELECT dt.perfil_sensorial_id FROM detalhes_troca dt
         JOIN trocas_alimentares ta ON dt.troca_alimentar_id = ta.id
         WHERE ta.assistido_id = $1
           AND ta.refeicao = $2
           AND dt.status = 'recusado'
           AND dt.perfil_sensorial_id IS NOT NULL`,
        [assistidoId, nomeRefeicao]
    );
    
    const idsPerfisRecusados = recusaRes.rows.map(r => r.perfil_sensorial_id);
    return idsPerfisRecusados;
}

async function _gerarSugestoesPorRefeicao(assistidoId, nomeRefeicao, excluirPerfilIds = []) {
    try {
        const template = TEMPLATES_DE_REFEICAO[nomeRefeicao];
        if (!template) throw new Error(`Refeição "${nomeRefeicao}" inválida.`);

        // 1. Buscar TODOS os perfis sensoriais dos alimentos seguros
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

        if (perfisSegurosBase.length === 0) {
             console.warn(`(Service) Assistido ${assistidoId} não possui alimentos seguros.`);
             const itensVazios = template.map(grupo => ({
                grupo_alimentar: grupo, alimento: 'Sem sugestão', status: 'vazio',
                alimentoId: null, perfilId: null, motivo: 'Adicione alimentos seguros ou responda o questionário.', score: null
             }));
             return { refeicao: nomeRefeicao, itens: itensVazios };
        }

        const idsAlimentosSeguros = [...new Set(perfisSegurosBase.map(p => p.alimento_id))];
        
        // Lista de perfis que não podem ser sugeridos (recusados + os próprios seguros)
        const perfisParaExcluir = [
            ...excluirPerfilIds, // Lista do histórico de recusa
            ...perfisSegurosBase.map(p => p.perfil_id) // Perfis dos alimentos seguros
        ];

        const refeicaoItens = [];

        // 2. Itera por CADA item do template (ex: 'Frutas', 'Proteínas'...)
        for (const grupoParaPreencher of template) {
            
            // MELHORIA 1: "Comparação Inteligente"
            let perfisDeComparacao = perfisSegurosBase.filter(p => p.grupo_alimentar === grupoParaPreencher);
            if (perfisDeComparacao.length === 0) {
                perfisDeComparacao = perfisSegurosBase;
            }

            // 3. Compara o slot com os perfis de base corretos
            const melhorSugestaoParaGrupo = await _buscarMelhorCandidatoParaGrupo(
                perfisDeComparacao,    
                grupoParaPreencher,    
                nomeRefeicao,          
                idsAlimentosSeguros,   
                perfisParaExcluir      
            );
            
            if (melhorSugestaoParaGrupo) {
                refeicaoItens.push({
                    grupo_alimentar: grupoParaPreencher,
                    alimento: `${melhorSugestaoParaGrupo.nome} (${melhorSugestaoParaGrupo.forma_de_preparo})`,
                    status: 'sugerido', 
                    alimentoId: melhorSugestaoParaGrupo.alimentoId,
                    perfilId: melhorSugestaoParaGrupo.perfilId,
                    motivo: melhorSugestaoParaGrupo.motivo,
                    score: melhorSugestaoParaGrupo.score,
                });
                perfisParaExcluir.push(melhorSugestaoParaGrupo.perfilId); 
            } else {
                refeicaoItens.push({ 
                    grupo_alimentar: grupoParaPreencher, 
                    alimento: 'Nenhuma sugestão encontrada', 
                    status: 'vazio', 
                    alimentoId: null, perfilId: null, motivo: 'Sem mais opções para este grupo', score: null 
                });
            }
        } 

        return { refeicao: nomeRefeicao, itens: refeicaoItens };

    } catch (error) {
        console.error('(Service) Erro ao gerar sugestões por refeição:', error);
        throw error; 
    }
}

 // REGRA DE PERSISTÊNCIA: Busca a última sugestão que ainda não foi avaliada.

async function getUltimaSugestaoAtiva(assistidoId, nomeRefeicao) {
    const client = await db.pool.connect();
    try {
        const trocaRes = await client.query(
            `SELECT id FROM trocas_alimentares
             WHERE assistido_id = $1 AND refeicao = $2
             ORDER BY data_sugestao DESC LIMIT 1`,
            [assistidoId, nomeRefeicao]
        );

        if (trocaRes.rows.length === 0) return null; 
        const trocaAlimentarId = trocaRes.rows[0].id;

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

        const feedbackDado = detalhesRes.rows.some(item => item.status === 'aceito' || item.status === 'recusado');
        if (feedbackDado) {
            return null; // Já foi avaliada, precisa gerar uma nova
        }

        const itens = detalhesRes.rows.map(item => ({
            grupo_alimentar: item.grupo_alimentar || 'N/A',
            alimento: item.nome ? `${item.nome} (${item.forma_de_preparo || 'Natural'})` : 'Vazio',
            status: item.status, 
            alimentoId: item.alimentoId,
            perfilId: item.perfilId,
            motivo: item.motivo,
            score: null, 
            detalheTrocaId: item.detalheTrocaId,
        }));
        
        const template = TEMPLATES_DE_REFEICAO[nomeRefeicao];
        if (template) {
            itens.sort((a, b) => (template.indexOf(a.grupo_alimentar) || 0) - (template.indexOf(b.grupo_alimentar) || 0));
        }

        return {
            refeicao: nomeRefeicao,
            trocaAlimentarId: trocaAlimentarId,
            itens: itens
        };

    } catch (error) {
        console.error('Erro ao buscar última sugestão ativa:', error);
        throw error;
    } finally {
        client.release();
    }
}


//Gera a sugestão E salva no banco em uma transação.

async function gerarESalvarSugestao(assistidoId, nomeRefeicao, client) {
    const runner = client || db.pool;
    
    // 1. Busca o histórico de recusas ANTES de gerar
    const perfisRecusadosIds = await _buscarHistoricoDeRecusa(assistidoId, nomeRefeicao, runner);

    // 2. Gera a lógica da sugestão (função pura)
    const sugestaoGerada = await _gerarSugestoesPorRefeicao(assistidoId, nomeRefeicao, perfisRecusadosIds);

    if (!sugestaoGerada || sugestaoGerada.itens.length === 0 || sugestaoGerada.itens.every(i => i.status === 'vazio')) {
        return null; // Retorna nulo se não houver sugestões
    }

    // 3. Salva a sugestão gerada no banco
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

        const sugestaoSalva = {
            ...sugestaoGerada,
            trocaAlimentarId: trocaAlimentarId,
            itens: sugestaoGerada.itens.map((item, index) => ({
                ...item,
                detalheTrocaId: insertedDetails[index].rows[0].id,
            }))
        };
        
        return sugestaoSalva;

    } catch (dbError) {
        if (isInternalTransaction) await dbClient.query('ROLLBACK'); 
        console.error('Erro no Serviço ao salvar sugestão:', dbError);
        throw dbError; 
    } finally {
        if (isInternalTransaction) dbClient.release(); 
    }
}


 // Processa o feedback e atualiza a tabela alimentos_seguros

async function processarFeedbackESalvarSeguros(assistidoId, feedbackList, client) {
    try {
        for (const feedback of feedbackList) {
            const { detalheTrocaId, status, alimentoId, perfilId } = feedback;
            if (!['aceito', 'recusado'].includes(status)) continue;

            const updateRes = await client.query(
                 `UPDATE detalhes_troca SET status = $1
                  WHERE id = $2 AND status = 'sugerido' 
                  AND EXISTS (
                     SELECT 1 FROM trocas_alimentares ta
                     WHERE ta.id = detalhes_troca.troca_alimentar_id
                     AND ta.assistido_id = $3
                  )
                  RETURNING id`,
                 [status, detalheTrocaId, assistidoId]
             );

            if (updateRes.rowCount > 0) { 
                if (status === 'aceito' && alimentoId) {
                    await AlimentoSeguro.create(assistidoId, alimentoId, client); 
                } else if (status === 'recusado' && alimentoId) {
                    await AlimentoSeguro.delete(assistidoId, alimentoId, client); 
                }
            }
        }
        return; 

    } catch (error) {
        console.error('(Service) Erro ao processar feedback:', error);
        throw error;
    }
}


 // Orquestra o fluxo de feedback E a geração da *próxima* sugestão.

async function processarFeedbackESalvarNovaSugestao(assistidoId, nomeRefeicao, feedback) {
    
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN'); // Inicia a transação

        // 1. Processa o feedback
        await processarFeedbackESalvarSeguros(assistidoId, feedback, client);

        // 2. Gera e salva uma NOVA sugestão, dentro da transação
        const novaSugestao = await gerarESalvarSugestao(assistidoId, nomeRefeicao, client);
        
        await client.query('COMMIT'); // Commita tudo
        
        return novaSugestao;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('(Service) Erro ao processar feedback e gerar nova sugestão:', error);
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