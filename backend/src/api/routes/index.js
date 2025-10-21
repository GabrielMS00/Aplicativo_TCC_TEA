// backend/src/api/routes/index.js
const express = require('express');
const router = express.Router();

// Importa APENAS os módulos que já têm código
const authRoutes = require('./authRoutes');
const cuidadorRoutes = require('./cuidadorRoutes');

// Delega as rotas para os módulos corretos
router.use('/auth', authRoutes); // Rotas públicas (ex: /api/auth/login)
router.use('/cuidador', cuidadorRoutes); // Rotas privadas (ex: /api/cuidador/perfil)

/*

const assistidoRoutes = require('./assistidoRoutes');
const questionarioRoutes = require('./questionarioRoutes');
const sugestaoRoutes = require('./sugestaoRoutes');
const relatorioRoutes = require('./relatorioRoutes');

router.use('/assistidos', assistidoRoutes); 
router.use('/questionarios', questionarioRoutes);
router.use('/sugestoes', sugestaoRoutes);
router.use('/relatorios', relatorioRoutes);
*/

module.exports = router;