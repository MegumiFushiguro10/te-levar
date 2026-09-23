// --- routes/documentRoutes.js ---
const express = require('express');
const router = express.Router();

const documentController = require('../controllers/documentController');
const autenticarToken = require('../middlewares/authMiddleware');
const uploadDocumento = require('../middlewares/documentUploadMiddleware');

// Rota: POST /api/chat/documento (ou montada onde você preferir)
// 1º: Valida o Token JWT do usuário
// 2º: Faz o parsing do arquivo 'documento' via Multer na RAM
// 3º: Dispara a extração com pdf-parse
router.post('/documento', autenticarToken, uploadDocumento.single('documento'), documentController.consultarDocumento);

module.exports = router;