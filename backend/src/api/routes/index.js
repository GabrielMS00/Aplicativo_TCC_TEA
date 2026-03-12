const express = require('express');
const router = express.Router();

// Importa apenas os módulos que já têm código
const authRoutes = require('./authRoutes');
const cuidadorRoutes = require('./cuidadorRoutes');
const assistidoRoutes = require('./assistidoRoutes');
const questionarioRoutes = require('./questionarioRoutes');
const sugestaoRoutes = require('./sugestaoRoutes');
const relatorioRoutes = require('./relatorioRoutes');

// Delega as rotas para os módulos corretos
router.use('/auth', authRoutes);
router.use('/cuidador', cuidadorRoutes);
router.use('/assistidos', assistidoRoutes); 
router.use('/questionarios', questionarioRoutes);
router.use('/sugestoes', sugestaoRoutes);
router.use('/relatorios', relatorioRoutes);

module.exports = router;