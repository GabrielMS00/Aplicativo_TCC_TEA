const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { protect } = require('../middlewares/authMiddleware');

// Rota corrigida: chama 'gerarRelatorioGeral' em vez de 'getHistoricoTrocas'
// (Pode manter o caminho da URL como 'geral' ou 'historico', conforme sua preferência)
router.get('/:assistidoId/geral', protect, relatorioController.gerarRelatorioGeral);

module.exports = router;