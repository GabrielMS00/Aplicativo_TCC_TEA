const express = require('express');
const router = express.Router();
const sugestaoController = require('../controllers/sugestaoController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @route   GET /api/sugestoes/:assistidoId/:nomeRefeicao
 * @desc    Gera e salva uma nova sugestão para a refeição.
 * @access  Private
 * @param   {string} assistidoId - ID do assistido
 * @param   {string} nomeRefeicao - Nome da refeição
 * @query   {string} [excluirPerfilIds] - IDs de perfis (separados por vírgula) a excluir da geração.
 */
router.get('/:assistidoId/:nomeRefeicao', sugestaoController.getSugestaoParaRefeicao); // Nome da função mudou

/**
 * @route   POST /api/sugestoes/feedback/:assistidoId/:nomeRefeicao
 * @desc    Processa feedback da sugestão anterior, salva seguros e retorna uma NOVA sugestão salva.
 * @access  Private
 * @param   {string} assistidoId - ID do assistido
 * @param   {string} nomeRefeicao - Nome da refeição
 * @body    { feedback: Array<{ detalheTrocaId: string, status: 'aceito' | 'recusado', perfilId: string, alimentoId: string }> }
 */
router.post('/feedback/:assistidoId/:nomeRefeicao', sugestaoController.processarFeedbackESugerirNova); // Nome da função mudou

module.exports = router;