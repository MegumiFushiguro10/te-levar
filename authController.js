const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ação 1: CADASTRAR (Register)
async function register(req, res) {
    try {
        const { nome, email, senha } = req.body;

        // 1. Verifica se o e-mail já existe no banco
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ erro: "Este e-mail já está em uso!" });
        }

        // 2. Salva no banco (a criptografia acontece automaticamente lá no models/Usuario.js)
        const novoUsuario = new Usuario({ nome, email, senha });
        await novoUsuario.save();

        return res.status(201).json({ sucesso: true, mensagem: "Guerreiro cadastrado com sucesso!" });

    } catch (erro) {
        console.error("❌ Erro no cadastro:", erro);
        return res.status(500).json({ erro: "Erro interno no servidor." });
    }
}

// Ação 2: ENTRAR (Login)
async function login(req, res) {
    try {
        const { email, senha } = req.body;

        // 1. Procura o usuário pelo e-mail
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ erro: "E-mail ou senha incorretos." });
        }

        // 2. Compara a senha digitada com a criptografada do banco
        // (Estamos usando o método compararSenha que criamos no Model)
        const senhaValida = await usuario.compararSenha(senha);
        
        if (!senhaValida) {
            return res.status(400).json({ erro: "E-mail ou senha incorretos." });
        }

        // 3. Gera o Token JWT contendo o ID e o nome do usuário
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("Chave JWT_SECRET não configurada no .env");
        }

        const token = jwt.sign(
            { id: usuario._id, nome: usuario.nome }, 
            secret, 
            { expiresIn: '1d' } // O token expira em 1 dia
        );

        // 4. Devolve o Token e os dados do usuário
        return res.status(200).json({ 
            sucesso: true, 
            mensagem: "Bem-vindo de volta!",
            token: token,
            usuario: { nome: usuario.nome }
        });

    } catch (erro) {
        console.error("❌ Erro no login:", erro);
        return res.status(500).json({ erro: "Erro interno no servidor." });
    }
}

module.exports = { register, login };
