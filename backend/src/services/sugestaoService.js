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

// --- SIMILARIDADE SENSORIAL (por clusters) ---
// Dois valores são "parecidos" quando aparecem juntos em ao menos um cluster.
// Construção por clusters garante SIMETRIA (A parecido com B <=> B parecido com A)
// e cobre TODO o vocabulário usado no seed (Desfiada, Elástica, Espessa, Suculento...),
// que antes ficava de fora e nunca gerava ponte.
const CLUSTERS_TEXTURA = [
    ['Macia', 'Pastosa', 'Cremosa', 'Suculenta', 'Suculento', 'Fibrosa', 'Espessa'],
    ['Pastosa', 'Cremosa', 'Espessa', 'Líquida', 'Aguada'],
    ['Líquida', 'Aguada', 'Cremosa'],
    ['Crocante', 'Seca', 'Granulada', 'Firme'],
    ['Firme', 'Elástica', 'Desfiada', 'Macia'],
    ['Desfiada', 'Fibrosa', 'Macia'],
    ['Granulada', 'Seca', 'Pastosa'],
];

const CLUSTERS_SABOR = [
    ['Doce', 'Suave', 'Neutro'],
    ['Salgado', 'Umami', 'Neutro'],
    ['Ácido', 'Doce'],
    ['Amargo', 'Ácido'],
    ['Picante', 'Salgado'],
    ['Suave', 'Neutro', 'Aguado'],
];

// Cores genéricas não devem gerar semelhança (dois "Variada" não se parecem de fato).
const CORES_GENERICAS = new Set(['Variada', 'Incolor']);

// Pesos da pontuação. Textura e sabor são os sinais PRIMÁRIOS (criam ponte);
// cor e temperatura são secundários (apenas reforçam).
const PESO = { texturaIgual: 15, texturaParecida: 8, saborIgual: 15, saborParecido: 8, cor: 5, temperatura: 4 };

// Regras do "encadeamento alimentar":
const MIN_PONTE = 8;            // ponte real exige ao menos UMA relação de textura OU sabor
const SCORE_CONFORTO = 22;      // peso de um alimento seguro (âncora de conforto no prato)
const SCORE_NOVIDADE = 6;       // alimento novo sem ponte sensorial real (aparece de vez em quando)
const PENALIDADE_RECUSA = 1000; // joga alimentos recusados para o fim da fila
const JITTER = 3;               // pequena aleatoriedade para variar entre opções empatadas

function compartilhamCluster(a, b, clusters) {
    if (!a || !b) return false;
    if (a === b) return true;
    return clusters.some(grupo => grupo.includes(a) && grupo.includes(b));
}

// Calcula a similaridade entre um alimento seguro e um candidato novo.
// Retorna a pontuação total, a parcela de textura/sabor (define se é ponte real)
// e os motivos legíveis para o cuidador.
function calcularSimilaridade(seguro, cand) {
    let score = 0;
    let scoreTexturaSabor = 0;
    const motivos = [];

    // Textura (primário)
    if (seguro.textura && seguro.textura === cand.textura) {
        score += PESO.texturaIgual; scoreTexturaSabor += PESO.texturaIgual;
        motivos.push('mesma textura');
    } else if (compartilhamCluster(seguro.textura, cand.textura, CLUSTERS_TEXTURA)) {
        score += PESO.texturaParecida; scoreTexturaSabor += PESO.texturaParecida;
        motivos.push('textura parecida');
    }

    // Sabor (primário)
    if (seguro.sabor && seguro.sabor === cand.sabor) {
        score += PESO.saborIgual; scoreTexturaSabor += PESO.saborIgual;
        motivos.push('mesmo sabor');
    } else if (compartilhamCluster(seguro.sabor, cand.sabor, CLUSTERS_SABOR)) {
        score += PESO.saborParecido; scoreTexturaSabor += PESO.saborParecido;
        motivos.push('sabor parecido');
    }

    // Cor e temperatura (secundários — reforçam, mas não criam ponte sozinhos)
    if (seguro.cor_predominante && seguro.cor_predominante === cand.cor_predominante
        && !CORES_GENERICAS.has(cand.cor_predominante)) {
        score += PESO.cor; motivos.push('mesma cor');
    }
    if (seguro.temperatura_servico && seguro.temperatura_servico === cand.temperatura_servico) {
        score += PESO.temperatura; motivos.push('mesma temperatura');
    }

    return { score, scoreTexturaSabor, motivos };
}

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
        // Pequena aleatoriedade só para desempatar opções equivalentes (variedade).
        const jitter = Math.random() * JITTER;
        const isSeguro = idsSeguros.has(cand.id);
        const isRecusado = recusadosIds.has(cand.id);

        let score;
        let motivo;
        let status;

        if (isSeguro) {
            // Já aceito pela criança → âncora de conforto no prato.
            status = 'base_segura';
            motivo = 'Opção segura da rotina';
            score = SCORE_CONFORTO;
        } else {
            // Alimento novo → busca a MELHOR ponte entre todos os perfis seguros.
            let melhor = { score: 0, scoreTexturaSabor: 0, motivos: [] };
            let melhorReferencia = null;
            for (const seguro of seguros) {
                const sim = calcularSimilaridade(seguro, cand);
                if (sim.score > melhor.score) {
                    melhor = sim;
                    melhorReferencia = seguro;
                }
            }

            if (melhor.scoreTexturaSabor >= MIN_PONTE && melhorReferencia) {
                // Ponte real: parecido em textura e/ou sabor com algo que já é seguro.
                // A pontuação vem da similaridade → pontes fortes vencem o conforto;
                // pontes fracas perdem, deixando o conforto ancorar a refeição.
                status = 'sugerido';
                motivo = `Parecido com ${melhorReferencia.nome} (${melhor.motivos.slice(0, 2).join(' e ')})`;
                score = melhor.score;
            } else {
                // Só cor/temperatura em comum (ou nada) NÃO é ponte: entra como novidade leve.
                status = 'sugerido';
                motivo = 'Nova experiência para variar';
                score = SCORE_NOVIDADE;
            }
        }

        // Recusado nas últimas 24h → vai para o fim da fila (só aparece se não sobrar mais nada).
        if (isRecusado) {
            score -= PENALIDADE_RECUSA;
            motivo = isSeguro ? 'Tente novamente (opção segura)' : 'Tente novamente';
        }

        return { item: cand, score: score + jitter, motivo, status };
    });

    // Maior pontuação vence; empates são resolvidos pelo jitter.
    classificados.sort((a, b) => b.score - a.score);

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

module.exports = {
    getUltimaSugestaoAtiva,
    gerarESalvarSugestao,
    processarFeedbackESalvarNovaSugestao,
    // Expostos para testes unitários da lógica pura de similaridade/escolha:
    calcularSimilaridade,
    escolherMelhorOpcao,
};