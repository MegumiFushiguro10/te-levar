const mongoose = require('mongoose');

const JogadorSchema = new mongoose.Schema({
    nickname: { type: String, required: true, unique: true, trim: true },
    xp: { type: Number, default: 0 },
    dataAtualizacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Jogador', JogadorSchema);