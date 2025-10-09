const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para registrar: POST /api/auth/register
router.post('/register', authController.register);

// Rota para logar: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;