// --- START OF FILE Mensagem.js ---
const mongoose = require('mongoose');

const MensagemSchema = new mongoose.Schema({
    role: String, 
    parts: [{ text: String }], 
    imagemUrl: { type: String, default: null }, // 👈 NOVO CAMPO: Guarda o link do Cloudinary!
    dataHora: { type: Date, default: Date.now } 
});

const Mensagem = mongoose.model('Mensagem', MensagemSchema);
module.exports = Mensagem;