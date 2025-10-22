const express = require('express');
const router = express.Router();
const assistidoController = require('../controllers/assistidoController');
const { protect } = require('../middlewares/authMiddleware'); // Importamos nosso "segurança"

// Aplica o middleware 'protect' em TODAS as rotas deste arquivo
// Ninguém acessa /api/assistidos/* sem um token válido
router.use(protect);

// --- Rotas do CRUD de Assistidos ---

// POST /api/assistidos (Criar)
router.post('/', assistidoController.createAssistido);

// GET /api/assistidos (Listar todos do cuidador)
router.get('/', assistidoController.getAssistidos);

// PUT /api/assistidos/:id (Atualizar um assistido)
router.put('/:id', assistidoController.updateAssistido);

// DELETE /api/assistidos/:id (Apagar um assistido)
router.delete('/:id', assistidoController.deleteAssistido);

module.exports = router;