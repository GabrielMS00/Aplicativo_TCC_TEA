const sugestaoService = require('../../services/sugestaoService');
const Assistido = require('../models/Assistido');

exports.getSugestaoParaRefeicao = async (req, res) => {
    const { assistidoId, nomeRefeicao } = req.params;
    const cuidadorId = req.cuidador.id;

    const refeicoesValidas = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];
    if (!refeicoesValidas.includes(nomeRefeicao)) {
        return res.status(400).json({ error: 'Nome de refeição inválido.' });
    }

    try {
        // 1. Validar permissão (responsabilidade do controller)
        const assistido = await Assistido.findByIdAndCuidadorId(assistidoId, cuidadorId);
        if (!assistido) {
            return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
        }

        // 2. Tenta buscar a última sugestão ATIVA (Regra de Persistência)
        let sugestao = await sugestaoService.getUltimaSugestaoAtiva(assistidoId, nomeRefeicao);

        // 3. Se não houver sugestão ativa, GERA E SALVA uma nova
        if (!sugestao) {
            console.log(`(Controller) Nenhuma sugestão ativa. Gerando nova para ${assistidoId}/${nomeRefeicao}.`);
            // Note: Não passamos mais 'excluirPerfilIds' aqui,
            // pois o feedback é o único que controla isso.
            sugestao = await sugestaoService.gerarESalvarSugestao(assistidoId, nomeRefeicao);
        } else {
            console.log(`(Controller) Retornando sugestão ativa (ID: ${sugestao.trocaAlimentarId})`);
        }

        // 4. Se NADA for gerado (ex: sem alimentos seguros)
        if (!sugestao) {
            return res.status(404).json({ error: 'Não foi possível gerar sugestões (verifique alimentos seguros).' });
        }

        // 5. Retorna a sugestão (antiga ou nova)
        res.status(200).json(sugestao);

    } catch (error) {
        console.error('Erro no controller getSugestaoParaRefeicao:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao gerar sugestão.' });
    }
};

exports.processarFeedbackESugerirNova = async (req, res) => {
    const { assistidoId, nomeRefeicao } = req.params;
    const cuidadorId = req.cuidador.id;
    const { feedback } = req.body;

    // Validações de entrada (responsabilidade do controller)
    if (!Array.isArray(feedback)) {
        return res.status(400).json({ error: 'O campo "feedback" deve ser um array.' });
    }
    if (feedback.some(item => !item.detalheTrocaId || !item.status)) {
         return res.status(400).json({ error: 'Cada item de feedback deve conter detalheTrocaId e status.' });
    }
    const refeicoesValidas = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];
    if (!refeicoesValidas.includes(nomeRefeicao)) {
        return res.status(400).json({ error: 'Nome de refeição inválido.' });
    }

    try {
        // 1. Validar permissão
        const assistido = await Assistido.findByIdAndCuidadorId(assistidoId, cuidadorId);
        if (!assistido) {
            return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
        }

        // 2. Chama a função orquestradora do serviço
        const novaSugestao = await sugestaoService.processarFeedbackESalvarNovaSugestao(
            assistidoId, 
            nomeRefeicao, 
            feedback
        );

        if (!novaSugestao) {
             console.error(`(Controller) Falha ao gerar nova sugestão para ${assistidoId}/${nomeRefeicao} após feedback.`);
            return res.status(500).json({ error: 'Não foi possível gerar uma nova sugestão após o feedback.' });
        }
        
        // 3. Retorna a NOVA sugestão
        res.status(200).json(novaSugestao);

    } catch (error) {
        console.error('Erro no controller processarFeedbackESugerirNova:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao processar feedback.' });
    }
};