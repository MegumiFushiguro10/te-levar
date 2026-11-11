// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();

const Mensagem = require('../models/Mensagem');
const Usuario = require('../models/Usuario');
const autenticarToken = require('../middlewares/authMiddleware');
const apenasAdmin = require('../middlewares/apenasAdmin');

// 🔒 Rota 100% Blindada: Exige Token válido E papel de Admin
router.get('/tokens', autenticarToken, apenasAdmin, async (req, res) => {
    try {
        // =========================================================
        // PIPELINE 1: Total Geral de Tokens e Mensagens
        // =========================================================
        const [metricasGerais] = await Mensagem.aggregate([
            {
                $group: {
                    _id: null,
                    totalTokens: { $sum: "$tokensGastos" },
                    totalMensagens: { $sum: 1 }
                }
            }
        ]);

        // Quantidade total de usuários cadastrados
        const totalUsuarios = await Usuario.countDocuments();

        // =========================================================
        // PIPELINE 2: Agrupamento Diário (Perfeito para o Gráfico!)
        // =========================================================
        const historicoDiario = await Mensagem.aggregate([
            {
                // Filtra apenas onde houve consumo de tokens
                $match: {
                    tokensGastos: { $gt: 0 }
                }
            },
            {
                // Agrupa pelo dia no formato "YYYY-MM-DD"
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$dataHora" }
                    },
                    tokensNoDia: { $sum: "$tokensGastos" },
                    mensagensNoDia: { $sum: 1 }
                }
            },
            {
                // Ordena pelas datas mais antigas até as mais recentes
                $sort: { _id: 1 }
            }
        ]);

        return res.status(200).json({
            sucesso: true,
            resumo: {
                totalTokens: metricasGerais ? metricasGerais.totalTokens : 0,
                totalMensagens: metricasGerais ? metricasGerais.totalMensagens : 0,
                totalUsuarios: totalUsuarios
            },
            historicoDiario: historicoDiario
        });

    } catch (erro) {
        console.error("❌ Erro no Aggregation Pipeline de Analytics:", erro);
        return res.status(500).json({ erro: "Falha ao calcular métricas de telemetria." });
    }
});

module.exports = router;