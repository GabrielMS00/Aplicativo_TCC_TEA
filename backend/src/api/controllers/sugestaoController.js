// backend/src/api/controllers/sugestaoController.js
const sugestaoService = require('../../services/sugestaoService');
const Assistido = require('../models/Assistido');
const db = require('../../config/db');

/**
 * Gera e salva uma nova sugestão de refeição.
 * Rota: GET /api/sugestoes/:assistidoId/:nomeRefeicao
 * Query Params Opcionais:
 * - excluirPerfilIds (string separada por vírgula): IDs de perfis a excluir da geração.
 */
exports.getSugestaoParaRefeicao = async (req, res) => {
    const { assistidoId, nomeRefeicao } = req.params;
    const cuidadorId = req.cuidador.id;
    const { excluirPerfilIds } = req.query;

    const refeicoesValidas = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];
    if (!refeicoesValidas.includes(nomeRefeicao)) {
        return res.status(400).json({ error: 'Nome de refeição inválido.' });
    }

    let client; // Variável para o client do pool fora do try/catch

    try {
        // 1. Validar permissão
        const assistido = await Assistido.findByIdAndCuidadorId(assistidoId, cuidadorId);
        if (!assistido) {
            return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
        }

        // 2. Processar IDs a excluir
        let idsPerfisExcluirArray = [];
        if (excluirPerfilIds && typeof excluirPerfilIds === 'string') {
            idsPerfisExcluirArray = excluirPerfilIds.split(',').filter(id => id.trim() !== '');
        }

        // 3. Gerar a sugestão usando o serviço
        const sugestaoGerada = await sugestaoService.gerarSugestoesPorRefeicao(assistidoId, nomeRefeicao, idsPerfisExcluirArray);

        if (!sugestaoGerada || sugestaoGerada.itens.length === 0) {
            return res.status(404).json({ error: 'Não foi possível gerar sugestões (verifique alimentos seguros).' });
        }

        // 4. Salvar a sugestão gerada no banco de dados
        client = await db.pool.connect(); // Obtém conexão para a transaction
        try {
            await client.query('BEGIN');

            const trocaRes = await client.query(
                'INSERT INTO trocas_alimentares (refeicao, assistido_id) VALUES ($1, $2) RETURNING id',
                [nomeRefeicao, assistidoId]
            );
            const trocaAlimentarId = trocaRes.rows[0].id;

            const insertPromises = sugestaoGerada.itens.map(item =>
                client.query(
                    `INSERT INTO detalhes_troca
                     (troca_alimentar_id, alimento_novo_id, perfil_sensorial_id, status, motivo_sugestao)
                     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [trocaAlimentarId, item.alimentoId, item.perfilId, item.status, item.motivo]
                )
            );
            const insertedDetails = await Promise.all(insertPromises);

            await client.query('COMMIT');

            // 5. Montar o objeto final para retornar ao frontend
            const sugestaoParaRetornar = {
                ...sugestaoGerada,
                trocaAlimentarId: trocaAlimentarId,
                itens: sugestaoGerada.itens.map((item, index) => ({
                    ...item,
                    detalheTrocaId: insertedDetails[index].rows[0].id, // Adiciona o ID do detalhe
                }))
            };

            res.status(200).json(sugestaoParaRetornar);

        } catch (dbError) {
            if (client) await client.query('ROLLBACK'); // Rollback em caso de erro no DB
            console.error('Erro ao salvar sugestão no banco:', dbError);
            throw dbError; // Re-lança para o catch externo
        } finally {
            if (client) client.release(); // Libera a conexão
        }

    } catch (error) {
        console.error('Erro no controller getSugestaoParaRefeicao:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao gerar sugestão.' });
    }
};

/**
 * Processa o feedback de uma sugestão anterior e gera/retorna uma nova.
 * Rota: POST /api/sugestoes/feedback/:assistidoId/:nomeRefeicao
 * Body: { feedback: Array<{ detalheTrocaId: string, status: 'aceito' | 'recusado', perfilId: string, alimentoId: string }> }
 */
exports.processarFeedbackESugerirNova = async (req, res) => {
    const { assistidoId, nomeRefeicao } = req.params;
    const cuidadorId = req.cuidador.id;
    const { feedback } = req.body;

    if (!Array.isArray(feedback)) {
        return res.status(400).json({ error: 'O campo "feedback" deve ser um array.' });
    }
     // Validação básica dos itens do feedback
     if (feedback.some(item => !item.detalheTrocaId || !item.status || (item.status === 'aceito' && !item.alimentoId) || (item.status === 'recusado' && !item.perfilId))) {
         return res.status(400).json({ error: 'Cada item de feedback deve conter detalheTrocaId, status, e alimentoId (se aceito) ou perfilId (se recusado).' });
     }


    const refeicoesValidas = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];
    if (!refeicoesValidas.includes(nomeRefeicao)) {
        return res.status(400).json({ error: 'Nome de refeição inválido.' });
    }

    let client; // Variável para o client do pool fora do try/catch

    try {
        // 1. Validar permissão do assistido
        const assistido = await Assistido.findByIdAndCuidadorId(assistidoId, cuidadorId);
        if (!assistido) {
            return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
        }

        // 2. Processar feedback e salvar alimentos seguros (usando o serviço)
        const perfisParaExcluir = await sugestaoService.processarFeedbackESalvarSeguros(assistidoId, feedback);

        // 3. Gerar nova sugestão usando o serviço, passando os perfis a excluir
        const novaSugestaoGerada = await sugestaoService.gerarSugestoesPorRefeicao(assistidoId, nomeRefeicao, perfisParaExcluir);

        if (!novaSugestaoGerada || novaSugestaoGerada.itens.length === 0) {
            // Tenta gerar sem excluir NADA como fallback? Ou retorna erro?
            // Por enquanto, retorna erro se não conseguir gerar a nova.
             console.error(`(Controller) Falha ao gerar nova sugestão para ${assistidoId}/${nomeRefeicao} após feedback.`);
            return res.status(500).json({ error: 'Não foi possível gerar uma nova sugestão após o feedback.' });
        }

        // 4. Salvar a NOVA sugestão gerada no banco
        client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const novaTrocaRes = await client.query(
                'INSERT INTO trocas_alimentares (refeicao, assistido_id) VALUES ($1, $2) RETURNING id',
                [nomeRefeicao, assistidoId]
            );
            const novaTrocaAlimentarId = novaTrocaRes.rows[0].id;

            const insertPromises = novaSugestaoGerada.itens.map(item =>
                client.query(
                    `INSERT INTO detalhes_troca
                     (troca_alimentar_id, alimento_novo_id, perfil_sensorial_id, status, motivo_sugestao)
                     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [novaTrocaAlimentarId, item.alimentoId, item.perfilId, item.status, item.motivo]
                )
            );
            const insertedDetails = await Promise.all(insertPromises);

            await client.query('COMMIT');

            // 5. Montar o objeto final com a NOVA sugestão para retornar
            const sugestaoParaRetornar = {
                ...novaSugestaoGerada,
                trocaAlimentarId: novaTrocaAlimentarId,
                itens: novaSugestaoGerada.itens.map((item, index) => ({
                    ...item,
                    detalheTrocaId: insertedDetails[index].rows[0].id,
                }))
            };

            res.status(200).json(sugestaoParaRetornar);

        } catch (dbError) {
            if (client) await client.query('ROLLBACK');
            console.error('Erro ao salvar NOVA sugestão no banco após feedback:', dbError);
            throw dbError;
        } finally {
            if (client) client.release();
        }

    } catch (error) {
        console.error('Erro no controller processarFeedbackESugerirNova:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao processar feedback.' });
    }
};