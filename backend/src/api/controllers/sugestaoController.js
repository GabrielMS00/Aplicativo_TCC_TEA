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
        // Validar permissão
        const assistido = await Assistido.findByIdAndCuidadorId(assistidoId, cuidadorId);
        if (!assistido) {
            return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
        }

        // Tenta buscar a última sugestão ativa (Regra de Persistência)
        let sugestao = await sugestaoService.getUltimaSugestaoAtiva(assistidoId, nomeRefeicao);

        // Se não houver sugestão ativa, gra e salva uma nova
        if (!sugestao) {
            console.log(`(Controller) Nenhuma sugestão ativa. Gerando nova para ${assistidoId}/${nomeRefeicao}.`);
            sugestao = await sugestaoService.gerarESalvarSugestao(assistidoId, nomeRefeicao);
        } else {
            console.log(`(Controller) Retornando sugestão ativa (ID: ${sugestao.trocaAlimentarId})`);
        }

        // Se nada for gerado
        if (!sugestao) {
            return res.status(404).json({ error: 'Não foi possível gerar sugestões (verifique alimentos seguros).' });
        }

        // Retorna a sugestão
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

    // Validações de entrada
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
        // Validar permissão
        const assistido = await Assistido.findByIdAndCuidadorId(assistidoId, cuidadorId);
        if (!assistido) {
            return res.status(404).json({ error: 'Assistido não encontrado ou não pertence a este cuidador.' });
        }

        // Chama a função orquestradora do serviço
        const novaSugestao = await sugestaoService.processarFeedbackESalvarNovaSugestao(
            assistidoId, 
            nomeRefeicao, 
            feedback
        );

        if (!novaSugestao) {
             console.error(`(Controller) Falha ao gerar nova sugestão para ${assistidoId}/${nomeRefeicao} após feedback.`);
            return res.status(500).json({ error: 'Não foi possível gerar uma nova sugestão após o feedback.' });
        }
        
        // Retorna a nova sugestão
        res.status(200).json(novaSugestao);

    } catch (error) {
        console.error('Erro no controller processarFeedbackESugerirNova:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao processar feedback.' });
    }
};