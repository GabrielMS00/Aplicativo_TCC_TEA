const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

// Requisições para /api/auth serão gerenciadas pelo authRoutes
router.use('/auth', authRoutes);

// (Aqui entrarão as outras rotas no futuro, como /assistidos, /alimentos, etc.)

module.exports = router;