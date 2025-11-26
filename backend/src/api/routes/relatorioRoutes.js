const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// GET /api/relatorios/:assistidoId/geral
router.get('/:assistidoId/geral', relatorioController.gerarRelatorioGeral);

module.exports = router;