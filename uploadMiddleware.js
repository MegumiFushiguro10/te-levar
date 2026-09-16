// --- START OF FILE uploadMiddleware.js ---
const multer = require('multer');

// 1. Configura o armazenamento para a Memória RAM (Buffer)
const storage = multer.memoryStorage();

// 2. Cria o middleware de upload
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Limite de segurança: 5MB por imagem (pra não estourar a RAM do servidor gratuito)
    },
    fileFilter: (req, file, cb) => {
        // Aceitar apenas imagens
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Formato inválido! Apenas imagens são permitidas.'));
        }
    }
});

module.exports = upload;