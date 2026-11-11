const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: [true, 'O nome é obrigatório'], 
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'O email é obrigatório'], 
        unique: true, 
        trim: true,
        lowercase: true 
    },
    senha: { 
        type: String, 
        required: [true, 'A senha é obrigatória'] 
    },
    // 🛡️ NOVO: Papel do usuário no sistema (RBAC)
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

UsuarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.senha = await bcrypt.hash(this.senha, salt);
        next();
    } catch (erro) {
        next(erro);
    }
});

UsuarioSchema.methods.compararSenha = async function(senhaFornecida) {
    return await bcrypt.compare(senhaFornecida, this.senha);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);