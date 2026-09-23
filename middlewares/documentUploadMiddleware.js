// --- middlewares/documentUploadMiddleware.js ---
const multer = require('multer');

// Armazena o arquivo temporariamente na memória RAM (Buffer)
const storage = multer.memoryStorage();

const uploadDocumento = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite seguro de 10MB para documentos
    },
    fileFilter: (req, file, cb) => {
        // Aceita PDF e arquivos de texto puro (TXT)
        const tiposPermitidos = ['application/pdf', 'text/plain'];
        
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato inválido! Envie apenas arquivos PDF ou TXT.'));
        }
    }
});

module.exports = uploadDocumento;