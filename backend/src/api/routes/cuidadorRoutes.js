const express = require('express');
const router = express.Router();
const cuidadorController = require('../controllers/cuidadorController');
const { protect } = require('../middlewares/authMiddleware');

// 'protect' vai rodar antes de CADA rota definida neste arquivo
router.use(protect); 

// GET /api/cuidador/perfil (Buscar dados do próprio perfil)
router.get('/perfil', cuidadorController.getPerfil);

// PUT /api/cuidador/perfil (Atualizar dados do próprio perfil)
router.put('/perfil', cuidadorController.updatePerfil);

module.exports = router;