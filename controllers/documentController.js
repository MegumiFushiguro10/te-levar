// --- controllers/documentController.js ---
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Mensagem = require("../models/Mensagem"); // Opcional: caso queira salvar o histórico no banco

// 1. Inicializa o cliente do Gemini com a chave do .env
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function consultarDocumento(req, res) {
    try {
        const { pergunta } = req.body;
        const arquivo = req.file;

        // Validações básicas de entrada
        if (!arquivo) {
            return res.status(400).json({ erro: "Nenhum documento enviado. Envie um PDF ou TXT!" });
        }

        if (!pergunta || pergunta.trim() === "") {
            return res.status(400).json({ erro: "Por favor, faça uma pergunta sobre o documento." });
        }

        let textoExtraido = "";

        // =========================================================================
        // 1. EXTRAÇÃO DO TEXTO DO ARQUIVO NA RAM
        // =========================================================================
        if (arquivo.mimetype === 'application/pdf') {
            console.log(`📄 Lendo PDF: ${arquivo.originalname}...`);
            const dadosPdf = await pdfParse(arquivo.buffer);
            textoExtraido = dadosPdf.text;
        } else if (arquivo.mimetype === 'text/plain') {
            console.log(`📝 Lendo TXT: ${arquivo.originalname}...`);
            textoExtraido = arquivo.buffer.toString('utf-8');
        }

        // Validação se o documento possui texto extraível
        if (!textoExtraido || textoExtraido.trim().length === 0) {
            return res.status(400).json({ 
                erro: "Não foi possível extrair texto deste arquivo. Verifique se o PDF não é composto apenas por fotos/scans." 
            });
        }

        const textoDocumento = textoExtraido.trim();
        console.log(`📊 Caracteres extraídos: ${textoDocumento.length}`);

        // =========================================================================
        // 2. ENGENHARIA DE PROMPT (RAG - INJEÇÃO DE CONTEXTO)
        // =========================================================================
        const promptRAG = `
Você é um analista de dados corporativo extremamente preciso e metódico.
Abaixo está o documento de referência fornecido pelo usuário. Responda à pergunta do usuário baseando-se APENAS no texto fornecido.

DIRETRIZES RÍGIDAS:
1. Use estritamente as informações presentes no DOCUMENTO abaixo.
2. Se a resposta não estiver no texto, diga exatamente: "Desculpe, não encontrei essa informação no documento."
3. NÃO faça suposições, não deduza fatos e NÃO invente dados de fora do documento.
4. Mantenha um tom profissional, direto e objetivo.

DOCUMENTO:
"""
${textoDocumento}
"""

PERGUNTA DO USUÁRIO: ${pergunta.trim()}
`;

        // =========================================================================
        // 3. CONSULTA AO GEMINI COM CONTROLE DE TEMPERATURA
        // =========================================================================
        console.log(`🤖 Enviando prompt RAG para o Gemini...`);

        // Usamos temperature: 0.1 ou 0.2 para deixar o modelo o mais determinístico possível,
        // minimizando qualquer chance de alucinação ou criatividade indesejada.
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.1, // Quase zero criatividade = máxima fidelidade ao texto
                topP: 0.8
            }
        });

        const result = await model.generateContent(promptRAG);
        const respostaDaIA = result.response.text();

        // =========================================================================
        // 4. (OPCIONAL) REGISTRO NO BANCO DE DADOS
        // =========================================================================
        const nickname = req.usuario.nome || "Guerreiro";
        const perguntaFormatada = `[Documento: ${arquivo.originalname}] [${nickname}]: ${pergunta}`;

        await Mensagem.create({
            role: "user",
            parts: [{ text: perguntaFormatada }]
        });

        await Mensagem.create({
            role: "model",
            parts: [{ text: respostaDaIA }]
        });

        // =========================================================================
        // 5. RESPOSTA AO CLIENTE
        // =========================================================================
        return res.status(200).json({
            sucesso: true,
            arquivo: arquivo.originalname,
            pergunta: pergunta,
            resposta: respostaDaIA
        });

    } catch (erro) {
        console.error("❌ Erro no RAG corporativo:", erro);
        return res.status(500).json({ erro: "Erro ao processar o documento com a inteligência artificial." });
    }
}

module.exports = { consultarDocumento };