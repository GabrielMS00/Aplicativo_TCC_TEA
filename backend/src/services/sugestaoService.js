const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const db = require('../config/db');
const AlimentoSeguro = require('../api/models/AlimentoSeguro');

// --- 1. CONFIGURAÇÃO ---
const TEMPLATES = { 
    'Café da Manhã': ['Bebidas', 'Laticínios', 'Cereais e Tubérculos', 'Frutas'], 
    'Almoço': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes', 'Bebidas'], 
    'Jantar': ['Proteínas', 'Cereais e Tubérculos', 'Verduras e Legumes', 'Bebidas'], 
    'Lanche': ['Laticínios', 'Outros', 'Frutas', 'Bebidas'], 
};

// Mapa de similaridade simplificado para pontuação
const mapas = {
    textura: {
        'Macia': ['Pastosa', 'Cremosa', 'Suculenta'],
        'Crocante': ['Seca', 'Firme'],
        'Líquida': ['Cremosa', 'Aguada'],
    },
    sabor: {
        'Doce': ['Suave'],
        'Salgado': ['Suave'],
        'Ácido': ['Picante', 'Amargo'],
    }
};

// --- 2. HELPERS DE BANCO DE DADOS ---

async function getContexto(assistidoId, client) {
    // Busca o que o usuário JÁ COME
    const seguros = await client.query(`
        SELECT a.id, a.nome, a.grupo_alimentar, ps.textura, ps.temperatura_servico, ps.forma_de_preparo
        FROM alimentos_seguros ass
        JOIN alimentos a ON ass.alimento_id = a.id
        JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
        WHERE ass.assistido_id = $1
    `, [assistidoId]);

    // Busca o que o usuário RECUSOU nas últimas 24h
    const recusados = await client.query(`
        SELECT dt.alimento_novo_id 
        FROM detalhes_troca dt
        JOIN trocas_alimentares ta ON dt.troca_alimentar_id = ta.id
        WHERE ta.assistido_id = $1 AND dt.status = 'recusado'
          AND ta.data_sugestao > NOW() - INTERVAL '24 hours'
    `, [assistidoId]);

    return { 
        seguros: seguros.rows, 
        recusadosIds: new Set(recusados.rows.map(r => r.alimento_novo_id)) 
    };
}

async function getCandidatos(grupo, refeicao, client) {
    // Tenta buscar alimentos específicos para a refeição
    let res = await client.query(`
        SELECT a.id, a.nome, ps.id as perfil_id, ps.forma_de_preparo, ps.textura, ps.temperatura_servico, ps.sabor
        FROM alimentos a
        JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
        JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
        JOIN refeicoes r ON pr.refeicao_id = r.id
        WHERE a.grupo_alimentar = $1 AND r.nome = $2
    `, [grupo, refeicao]);
    
    // Se não achar nada (banco vazio para essa refeição), pega qualquer coisa do grupo (Emergência)
    if (res.rows.length === 0) {
        res = await client.query(`
            SELECT a.id, a.nome, ps.id as perfil_id, ps.forma_de_preparo, ps.textura, ps.temperatura_servico, ps.sabor
            FROM alimentos a
            JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
            WHERE a.grupo_alimentar = $1
        `, [grupo]);
    }
    return res.rows;
}

// --- 3. LÓGICA DE ESCOLHA (TIERS) ---

function escolherMelhorOpcao(candidatos, seguros, recusadosIds, usadosAgora) {
    // Remove duplicatas do prato atual
    const disponiveis = candidatos.filter(c => !usadosAgora.has(c.id));
    if (disponiveis.length === 0) return null;

    const idsSeguros = new Set(seguros.map(s => s.id));

    // Classifica cada candidato em um Tier
    const classificados = disponiveis.map(cand => {
        let tier = 5; // Padrão: Ruim
        let motivo = 'Opção disponível';
        let status = 'sugerido';
        let score = Math.random(); // Desempate aleatório

        const isSeguro = idsSeguros.has(cand.id);
        const isRecusado = recusadosIds.has(cand.id);

        // TIER 1: NOVIDADE PERFEITA (Não seguro, Não recusado, Similaridade Alta)
        if (!isSeguro && !isRecusado) {
            // Verifica similaridade
            const similar = seguros.find(s => 
                s.textura === cand.textura || 
                (mapas.textura[s.textura] || []).includes(cand.textura)
            );
            
            if (similar) {
                tier = 1;
                motivo = `Similar a ${similar.nome}`;
                score += 10; // Prioridade máxima
            } else {
                // TIER 2: NOVIDADE ALEATÓRIA (Não seguro, Não recusado, Sem similaridade)
                tier = 2;
                motivo = 'Sugestão para variar';
            }
        }
        // TIER 3: CURINGA (Seguro, Não recusado recentemente)
        else if (isSeguro && !isRecusado) {
            tier = 3;
            motivo = 'Opção segura da rotina';
            status = 'base_segura';
        }
        // TIER 4: RECICLAGEM (Seguro, mas foi recusado hoje - Insistir no seguro é melhor que o desconhecido)
        else if (isSeguro && isRecusado) {
            tier = 4;
            motivo = 'Tente novamente (Seguro)';
            status = 'base_segura';
        }
        // TIER 5: DESESPERO (Novo e Recusado - só pra não vir vazio)
        else {
            tier = 5;
            motivo = 'Opção disponível';
        }

        return { item: cand, tier, score, motivo, status };
    });

    // Ordena: Menor Tier ganha. Se empatar, maior Score ganha.
    classificados.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.score - a.score;
    });

    return classificados[0]; // Retorna o vencedor
}

// --- 4. SERVIÇOS EXPORTADOS ---

async function gerarESalvarSugestao(assistidoId, nomeRefeicao, client = null) {
    const dbClient = client || await db.pool.connect();
    const isInternal = !client;

    try {
        if (isInternal) await dbClient.query('BEGIN');

        const template = TEMPLATES[nomeRefeicao];
        if (!template) throw new Error("Template inválido");

        const { seguros, recusadosIds } = await getContexto(assistidoId, dbClient);
        
        const itensFinais = [];
        const usadosAgora = new Set();

        // 1. ESCOLHE OS ALIMENTOS (Memória)
        for (const grupo of template) {
            const candidatos = await getCandidatos(grupo, nomeRefeicao, dbClient);
            const escolha = escolherMelhorOpcao(candidatos, seguros, recusadosIds, usadosAgora);

            if (escolha) {
                itensFinais.push({
                    alimentoId: escolha.item.id,
                    perfilId: escolha.item.perfil_id,
                    nome: escolha.item.nome,
                    forma_de_preparo: escolha.item.forma_de_preparo,
                    status: escolha.status,
                    motivo: escolha.motivo,
                    grupo: grupo
                });
                usadosAgora.add(escolha.item.id);
            } else {
                // Backup extremo para não quebrar o front
                itensFinais.push({
                    alimentoId: null, perfilId: null, nome: 'Sem opções', 
                    forma_de_preparo: '', status: 'vazio', motivo: 'Banco vazio', grupo
                });
            }
        }

        // 2. SALVA NO BANCO (Sequencialmente para evitar erro de chave estrangeira)
        const trocaRes = await dbClient.query(
            'INSERT INTO trocas_alimentares (refeicao, assistido_id) VALUES ($1, $2) RETURNING id',
            [nomeRefeicao, assistidoId]
        );
        const trocaId = trocaRes.rows[0].id;

        // Insere um por um
        const itensComId = [];
        for (const item of itensFinais) {
            const detRes = await dbClient.query(
                `INSERT INTO detalhes_troca (troca_alimentar_id, alimento_novo_id, perfil_sensorial_id, status, motivo_sugestao)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [trocaId, item.alimentoId, item.perfilId, item.status, item.motivo]
            );
            
            itensComId.push({
                grupo_alimentar: item.grupo,
                alimento: item.alimentoId ? `${item.nome} (${item.forma_de_preparo})` : 'Indisponível',
                status: item.status,
                alimentoId: item.alimentoId,
                perfilId: item.perfilId,
                motivo: item.motivo,
                detalheTrocaId: detRes.rows[0].id
            });
        }

        if (isInternal) await dbClient.query('COMMIT');

        return { refeicao: nomeRefeicao, trocaAlimentarId: trocaId, itens: itensComId };

    } catch (e) {
        if (isInternal) await dbClient.query('ROLLBACK');
        throw e;
    } finally {
        // Só libera se foi criado aqui. Se veio de fora (feedback), quem criou que libere.
        if (isInternal && dbClient) dbClient.release();
    }
}

async function getUltimaSugestaoAtiva(assistidoId, nomeRefeicao) {
    const res = await db.query(`
        SELECT t.id as troca_id, dt.id as detalhe_id, dt.status, dt.motivo_sugestao, 
               a.nome, a.grupo_alimentar, ps.forma_de_preparo, dt.alimento_novo_id, dt.perfil_sensorial_id
        FROM trocas_alimentares t
        JOIN detalhes_troca dt ON t.id = dt.troca_alimentar_id
        LEFT JOIN alimentos a ON dt.alimento_novo_id = a.id
        LEFT JOIN perfis_sensoriais ps ON dt.perfil_sensorial_id = ps.id
        WHERE t.assistido_id = $1 AND t.refeicao = $2
        ORDER BY t.data_sugestao DESC LIMIT 4
    `, [assistidoId, nomeRefeicao]);

    if (res.rows.length === 0) return null;
    // Se já avaliou ou se tem item quebrado (null), gera nova
    if (res.rows.some(r => ['aceito', 'recusado'].includes(r.status) || !r.nome)) return null;

    const itens = res.rows.map(r => ({
        grupo_alimentar: r.grupo_alimentar || 'N/A',
        alimento: `${r.nome} (${r.forma_de_preparo})`,
        status: r.status,
        alimentoId: r.alimento_novo_id,
        perfilId: r.perfil_sensorial_id,
        motivo: r.motivo_sugestao,
        detalheTrocaId: r.detalhe_id
    }));

    const template = TEMPLATES[nomeRefeicao] || [];
    itens.sort((a, b) => template.indexOf(a.grupo_alimentar) - template.indexOf(b.grupo_alimentar));

    return { refeicao: nomeRefeicao, trocaAlimentarId: res.rows[0].troca_id, itens };
}

async function processarFeedbackESalvarNovaSugestao(assistidoId, nomeRefeicao, feedbackList) {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        for (const fb of feedbackList) {
            if (!fb.alimentoId) continue;
            
            // Atualiza histórico
            await client.query('UPDATE detalhes_troca SET status = $1 WHERE id = $2', [fb.status, fb.detalheTrocaId]);

            // Atualiza Seguros
            if (fb.status === 'aceito') {
                await AlimentoSeguro.create(assistidoId, fb.alimentoId, client);
            } else if (fb.status === 'recusado') {
                await AlimentoSeguro.delete(assistidoId, fb.alimentoId, client);
            }
        }

        // Commit do feedback antes de gerar a nova, para que o getContexto já veja os novos dados
        await client.query('COMMIT'); 
        
        // Gera nova em nova transação (seguro)
        return await gerarESalvarSugestao(assistidoId, nomeRefeicao);

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

module.exports = { getUltimaSugestaoAtiva, gerarESalvarSugestao, processarFeedbackESalvarNovaSugestao };