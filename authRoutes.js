const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ⚠️ ATENÇÃO: O caminho aqui deve ser apenas '/register', SEM o '/api/auth' na frente!
router.post('/register', authController.register);

// O caminho aqui deve ser apenas '/login'
router.post('/login', authController.login);

module.exports = router;