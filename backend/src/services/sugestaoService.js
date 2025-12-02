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

// Mapas de similaridade (Expandidos)
const mapas = {
    textura: {
        'Macia': ['Pastosa', 'Cremosa', 'Suculenta', 'Fibrosa', 'Firme'],
        'Pastosa': ['Macia', 'Cremosa'],
        'Cremosa': ['Macia', 'Pastosa', 'Líquida'],
        'Crocante': ['Seca', 'Firme', 'Granulada'],
        'Seca': ['Crocante', 'Granulada'],
        'Firme': ['Crocante', 'Macia'],
        'Líquida': ['Cremosa', 'Aguada'],
        'Aguada': ['Líquida', 'Suculenta'],
        'Granulada': ['Seca', 'Crocante'],
        'Fibrosa': ['Macia'],
        'Suculenta': ['Macia', 'Aguada']
    },
    sabor: {
        'Doce': ['Suave', 'Ácido'], 
        'Salgado': ['Suave', 'Umami', 'Picante'],
        'Ácido': ['Doce', 'Amargo'],
        'Suave': ['Doce', 'Salgado', 'Neutro'],
        'Amargo': ['Ácido'],
        'Neutro': ['Suave', 'Salgado'],
        'Picante': ['Salgado'],
        'Umami': ['Salgado']
    }
};

// --- HELPERS ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- 2. HELPERS DE BANCO DE DADOS ---

async function getContexto(assistidoId, client) {
    // ADICIONADO: ps.cor_predominante e ps.temperatura_servico
    const seguros = await client.query(`
        SELECT a.id, a.nome, a.grupo_alimentar, 
               ps.textura, ps.temperatura_servico, ps.forma_de_preparo, ps.sabor, ps.cor_predominante
        FROM alimentos_seguros ass
        JOIN alimentos a ON ass.alimento_id = a.id
        JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
        WHERE ass.assistido_id = $1
    `, [assistidoId]);

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
    // ADICIONADO: ps.cor_predominante
    let res = await client.query(`
        SELECT a.id, a.nome, ps.id as perfil_id, 
               ps.forma_de_preparo, ps.textura, ps.temperatura_servico, ps.sabor, ps.cor_predominante
        FROM alimentos a
        JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
        JOIN perfil_refeicao pr ON ps.id = pr.perfil_sensorial_id
        JOIN refeicoes r ON pr.refeicao_id = r.id
        WHERE a.grupo_alimentar = $1 AND r.nome = $2
    `, [grupo, refeicao]);
    
    // Fallback se não tiver nada específico para a refeição
    if (res.rows.length === 0) {
        res = await client.query(`
            SELECT a.id, a.nome, ps.id as perfil_id, 
                   ps.forma_de_preparo, ps.textura, ps.temperatura_servico, ps.sabor, ps.cor_predominante
            FROM alimentos a
            JOIN perfis_sensoriais ps ON a.id = ps.alimento_id
            WHERE a.grupo_alimentar = $1
        `, [grupo]);
    }
    return res.rows;
}

// --- 3. LÓGICA DE ESCOLHA (TIERS) ---

function escolherMelhorOpcao(candidatos, seguros, recusadosIds, usadosAgora) {
    const disponiveis = candidatos.filter(c => !usadosAgora.has(c.id));
    if (disponiveis.length === 0) return null;

    const idsSeguros = new Set(seguros.map(s => s.id));

    const classificados = disponiveis.map(cand => {
        let tier = 5; 
        let motivo = 'Opção disponível';
        let status = 'sugerido';
        let score = Math.random(); 

        const isSeguro = idsSeguros.has(cand.id);
        const isRecusado = recusadosIds.has(cand.id);

        if (!isSeguro && !isRecusado) {
            // LÓGICA DE SIMILARIDADE TURBINADA
            // Agora verifica Cor e Temperatura também
            const similar = seguros.find(s => {
                const texturaMatch = s.textura === cand.textura || (mapas.textura[s.textura] || []).includes(cand.textura);
                const saborMatch = s.sabor === cand.sabor || (mapas.sabor[s.sabor] || []).includes(cand.sabor);
                const tempMatch = s.temperatura_servico === cand.temperatura_servico; // Novo
                const corMatch = s.cor_predominante === cand.cor_predominante; // Novo

                return texturaMatch || saborMatch || tempMatch || corMatch;
            });
            
            if (similar) {
                tier = 1; // Prioridade MÁXIMA
                
                // Define o motivo mais forte encontrado
                if (similar.textura === cand.textura) motivo = `Textura igual a ${similar.nome}`;
                else if (similar.sabor === cand.sabor) motivo = `Sabor igual a ${similar.nome}`;
                else if (similar.cor_predominante === cand.cor_predominante) motivo = `Mesma cor que ${similar.nome}`;
                else if (similar.temperatura_servico === cand.temperatura_servico) motivo = `Temperatura igual a ${similar.nome}`;
                else motivo = `Lembra ${similar.nome}`;

                score += 20; // Bônus alto para garantir que ganhe da rotina
            } else {
                tier = 2; // Novidade sem referência (Aleatória)
                motivo = 'Sugestão para variar';
            }
        }
        else if (isSeguro && !isRecusado) {
            tier = 3; // Rotina
            motivo = 'Opção segura da rotina';
            status = 'base_segura';
        }
        else if (isSeguro && isRecusado) {
            tier = 4;
            motivo = 'Tente novamente (Seguro)';
            status = 'base_segura';
        }
        else {
            tier = 5;
            motivo = 'Opção disponível';
        }

        return { item: cand, tier, score, motivo, status };
    });

    // Ordenação: 
    // 1. Menor Tier ganha (Tier 1 > Tier 2 > Tier 3)
    // 2. Maior Score ganha (Desempate)
    classificados.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier; 
        return b.score - a.score;
    });

    return classificados[0];
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
        
        // Mantém o embaralhamento para garantir variedade nas referências
        const segurosEmbaralhados = shuffleArray([...seguros]);

        const itensFinais = [];
        const usadosAgora = new Set();

        for (const grupo of template) {
            const candidatos = await getCandidatos(grupo, nomeRefeicao, dbClient);
            const escolha = escolherMelhorOpcao(candidatos, segurosEmbaralhados, recusadosIds, usadosAgora);

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
                itensFinais.push({
                    alimentoId: null, perfilId: null, nome: 'Sem opções', 
                    forma_de_preparo: '', status: 'vazio', motivo: 'Banco vazio', grupo
                });
            }
        }

        const trocaRes = await dbClient.query(
            'INSERT INTO trocas_alimentares (refeicao, assistido_id) VALUES ($1, $2) RETURNING id',
            [nomeRefeicao, assistidoId]
        );
        const trocaId = trocaRes.rows[0].id;

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
            
            await client.query('UPDATE detalhes_troca SET status = $1 WHERE id = $2', [fb.status, fb.detalheTrocaId]);

            if (fb.status === 'aceito') {
                await AlimentoSeguro.create(assistidoId, fb.alimentoId, client);
            } else if (fb.status === 'recusado') {
                await AlimentoSeguro.delete(assistidoId, fb.alimentoId, client);
            }
        }

        await client.query('COMMIT'); 
        
        return await gerarESalvarSugestao(assistidoId, nomeRefeicao);

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

module.exports = { getUltimaSugestaoAtiva, gerarESalvarSugestao, processarFeedbackESalvarNovaSugestao };