const express = require('express');
const router = express.Router();
const questionarioController = require('../controllers/questionarioController');
const { protect } = require('../middlewares/authMiddleware');

// Todas as rotas de questionário são protegidas
router.use(protect);

// Rota para GET /api/questionarios/modelos (Listar questionários)
router.get('/modelos', questionarioController.getModelos);

// Rota para GET /api/questionarios/modelos/:id (Buscar um modelo completo)
router.get('/modelos/:id', questionarioController.getModeloCompleto);

// Rota para POST /api/questionarios/:assistidoId/responder (Salvar respostas)
router.post('/:assistidoId/responder', questionarioController.salvarRespostas);

module.exports = router;