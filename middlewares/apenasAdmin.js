/**
 * Middleware de Controle de Acesso Baseado em Função (RBAC)
 * Garante que apenas usuários com papel 'admin' passem pela catraca.
 * 
 * ATENÇÃO: Deve ser executado SEMPRE DEPOIS do middleware autenticarToken!
 */
function apenasAdmin(req, res, next) {
    // 1. Verifica se a requisição já foi autenticada e possui os dados do usuário
    if (!req.usuario) {
        return res.status(401).json({ 
            erro: "Acesso não autenticado. Faça login primeiro." 
        });
    }

    // 2. Valida se o papel (role) é de administrador
    if (req.usuario.role !== 'admin') {
        return res.status(403).json({ 
            erro: "Acesso proibido (403 Forbidden). Recurso exclusivo para administradores da Arena." 
        });
    }

    // 3. Se for admin, concede a passagem
    next();
}

module.exports = apenasAdmin;