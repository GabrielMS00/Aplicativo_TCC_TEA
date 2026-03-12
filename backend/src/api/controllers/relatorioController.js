const db = require('../../config/db');
const Assistido = require('../models/Assistido');

exports.gerarRelatorioGeral = async (req, res) => {
    const { assistidoId } = req.params;
    const cuidadorId = req.cuidador.id;

    try {
        // Validação de segurança
        const assistido = await Assistido.findByIdAndCuidadorId(assistidoId, cuidadorId);
        if (!assistido) {
            return res.status(404).json({ error: 'Assistido não encontrado.' });
        }

        // Buscar Respostas dos Questionários
        const queryQuestionarios = `
            SELECT 
                mq.nome as questionario,
                mp.texto_pergunta,
                mor.texto_opcao
            FROM questionarios_respondidos qr
            JOIN modelos_questionarios mq ON qr.modelo_questionario_id = mq.id
            JOIN respostas r ON r.questionario_respondido_id = qr.id
            JOIN modelos_perguntas mp ON r.modelo_pergunta_id = mp.id
            JOIN modelos_opcoes_respostas mor ON r.modelo_opcao_resposta_id = mor.id
            WHERE qr.assistido_id = $1
            ORDER BY mq.nome, mp.texto_pergunta
        `;

        // Buscar Histórico de Trocas Alimentares
        const queryHistorico = `
            SELECT 
                ta.id as troca_id,
                ta.data_sugestao,
                ta.refeicao,
                a.nome as alimento_nome,
                ps.forma_de_preparo,
                dt.status,
                dt.motivo_sugestao
            FROM trocas_alimentares ta
            JOIN detalhes_troca dt ON dt.troca_alimentar_id = ta.id
            LEFT JOIN alimentos a ON dt.alimento_novo_id = a.id
            LEFT JOIN perfis_sensoriais ps ON dt.perfil_sensorial_id = ps.id
            WHERE ta.assistido_id = $1
            ORDER BY ta.data_sugestao DESC
        `;

        const [resQuestionarios, resHistorico] = await Promise.all([
            db.query(queryQuestionarios, [assistidoId]),
            db.query(queryHistorico, [assistidoId])
        ]);

        // Organiza o histórico
        const historicoAgrupado = [];
        const mapTrocas = new Map();

        resHistorico.rows.forEach(row => {
            if (!mapTrocas.has(row.troca_id)) {
                mapTrocas.set(row.troca_id, {
                    data: row.data_sugestao,
                    refeicao: row.refeicao,
                    itens: []
                });
                historicoAgrupado.push(mapTrocas.get(row.troca_id));
            }
            mapTrocas.get(row.troca_id).itens.push({
                alimento: row.alimento_nome ? `${row.alimento_nome} (${row.forma_de_preparo || 'Natural'})` : 'Item da Base Segura',
                status: row.status,
                motivo: row.motivo_sugestao
            });
        });

        const relatorio = {
            dadosPessoais: {
                nome: assistido.nome,
                dataNascimento: assistido.data_nascimento,
                nivelSuporte: assistido.nivel_suporte,
                grauSeletividade: assistido.grau_seletividade
            },
            questionarios: resQuestionarios.rows,
            historicoTrocas: historicoAgrupado
        };

        res.status(200).json(relatorio);

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro interno ao gerar relatório.' });
    }
};
