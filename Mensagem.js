// models/Mensagem.js
const mongoose = require('mongoose');

const MensagemSchema = new mongoose.Schema({
    role: String, 
    parts: [{ text: String }], 
    imagemUrl: { type: String, default: null },
    // 🪙 NOVO: Telemetria de consumo do Gemini
    tokensGastos: { type: Number, default: 0 },
    dataHora: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('Mensagem', MensagemSchema);