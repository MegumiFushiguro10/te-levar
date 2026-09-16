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
    }
}, {
    timestamps: true // Cria os campos createdAt e updatedAt automaticamente
});

// Middleware que executa ANTES de salvar no banco
UsuarioSchema.pre('save', async function(next) {
    // Se a senha não foi modificada ou é nova, seguimos para criptografar
    if (!this.isModified('senha')) {
        return next();
    }

    try {
        // Gera o "salt" (um fator de aleatoriedade para aumentar a segurança)
        const salt = await bcrypt.genSalt(10);
        // Criptografa a senha junto com o salt
        this.senha = await bcrypt.hash(this.senha, salt);
        next();
    } catch (erro) {
        next(erro);
    }
});

// Opcional: Adicionar um método para facilitar a verificação da senha no login futuramente
UsuarioSchema.methods.compararSenha = async function(senhaFornecida) {
    return await bcrypt.compare(senhaFornecida, this.senha);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);