const jwt = require('jsonwebtoken');

function autenticarToken(req, res, next) {
    // 1. Pega o cabeçalho de autorização da requisição
    const authHeader = req.headers['authorization'];

    // 2. Verifica se o cabeçalho existe (Geralmente vem no formato: "Bearer seu_token_aqui")
    if (!authHeader) {
        return res.status(401).json({ erro: "Acesso negado. Cadê sua pulseira VIP (Token)?" });
    }

    // 3. Extrai apenas o token (ignora a palavra "Bearer ")
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: "Acesso negado. Formato de token inválido." });
    }

    try {
        // 4. Valida o token usando a mesma chave secreta que criou ele no Login
        const segredo = process.env.JWT_SECRET;
        const usuarioDecodificado = jwt.verify(token, segredo);

        // 5. Se deu certo, anexa os dados do usuário (id, nome) na requisição (req.usuario)
        // Assim, as próximas funções (como o chatController) vão saber exatamente quem está fazendo o pedido
        req.usuario = usuarioDecodificado;

        // 6. Libera a catraca! Chama o next() pra requisição continuar seu caminho
        next();
        
    } catch (erro) {
        // Se o token foi adulterado ou já expirou (passou de 1 dia)
        console.error("❌ Token inválido:", erro.message);
        return res.status(401).json({ erro: "Acesso negado. Token inválido ou expirado." });
    }
}

module.exports = autenticarToken;