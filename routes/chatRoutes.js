// --- START OF FILE chatRoutes.js ---
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// 1. PRIMEIRO: Importamos os middlewares (o Segurança e o Carteiro)
const autenticarToken = require('../middlewares/authMiddleware'); 
const upload = require('../middlewares/uploadMiddleware'); 

// 2. DEPOIS: Criamos as rotas (Agora o Node já sabe quem é o autenticarToken!)

// Rota principal do Chat (Texto Normal)
router.post('/', chatController.conversarChat);

// Rota para limpar histórico
router.delete('/limpar', chatController.limparHistorico);

// Rota: O Hall da Fama
router.get('/ranking', chatController.obterRanking);

// Rota: Buscar o histórico ao dar F5
router.get('/historico', autenticarToken, chatController.obterHistorico);

// Rota: O Chat com Visão (Multimodal - Foto + Texto)
router.post('/vision', autenticarToken, upload.single('imagem'), chatController.conversarComVisao);

module.exports = router;