const { GoogleGenerativeAI } = require("@google/generative-ai");
const Mensagem = require("../models/Mensagem");
const Jogador = require("../models/Jogador");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Adicione isso lá no topo, abaixo dos outros requires:
const cloudinary = require('cloudinary').v2;

// No chatController.js, fica EXATAMENTE assim:
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ============================================================================
// 1. REGRAS DO JOGO E DECLARAÇÃO DAS FERRAMENTAS (TOOLS)
// ============================================================================
const systemInstruction = `Você é o Guardião de um cofre de conhecimento místico. 
Suas habilidades:
1. Propor charadas de tecnologia. Se o usuário acertar, chame a ferramenta adicionarXP com 50 pontos. Se pedir resposta, revele e chame a ferramenta tirando 10 pontos (quantidade: -10).
2. Você tem a habilidade de manipular o tempo. Se o usuário perguntar o clima ou a temperatura de alguma cidade, chame a ferramenta buscarClimaTempoReal.
Responda sempre mantendo sua postura de Guardião enigmático.`;

const adicionarXPTool = {
    name: "adicionarXP",
    description: "Adiciona ou remove pontos de experiência (XP) do jogador.",
    parameters: {
        type: "OBJECT",
        properties: {
            nickname: { type: "STRING", description: "O nickname do jogador." },
            quantidade: { type: "NUMBER", description: "A quantidade de XP (positiva ou negativa)." }
        },
        required: ["nickname", "quantidade"]
    }
};

const climaTool = {
    name: "buscarClimaTempoReal",
    description: "Obtém a temperatura exata e o clima atual de uma cidade.",
    parameters: {
        type: "OBJECT",
        properties: {
            cidade: { type: "STRING", description: "O nome da cidade. Ex: Assis Chateaubriand, Tokyo." }
        },
        required: ["cidade"]
    }
};

// Empacotamos as duas ferramentas para enviar ao Gemini
const ferramentasDoIA = {
    functionDeclarations: [adicionarXPTool, climaTool]
};

// ============================================================================
// 2. FUNÇÕES LOCAIS (BACK-END ACTIONS)
// ============================================================================

// Ação 1: Banco de Dados (XP)
async function adicionarXP(nickname, quantidade) {
    try {
        const xpParaAdicionar = Number(quantidade);
        const jogadorAtualizado = await Jogador.findOneAndUpdate(
            { nickname: nickname.trim() },
            { $inc: { xp: xpParaAdicionar }, $set: { dataAtualizacao: new Date() } },
            { new: true, upsert: true }
        );
        return { sucesso: true, nickname: jogadorAtualizado.nickname, xpTotal: jogadorAtualizado.xp };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

// Ação 2: API Externa (Clima)
async function buscarClimaTempoReal(cidade) {
    try {
        const apiKey = process.env.WEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&units=metric&lang=pt_br&appid=${apiKey}`;
        
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error("Cidade não encontrada ou erro na API");
        
        const dados = await resposta.json();
        return {
            cidade: dados.name,
            temperatura: `${dados.main.temp.toFixed(1)}°C`,
            descricao: dados.weather[0].description
        };
    } catch (erro) {
        return { erro: true, mensagem: erro.message };
    }
}

// Ação: Buscar Histórico ao dar F5
async function obterHistorico(req, res) {
    try {
        // Busca as últimas 40 mensagens, em ordem cronológica
        const historico = await Mensagem.find().sort({ dataHora: 1 }).limit(40);
        return res.status(200).json({ sucesso: true, historico: historico });
    } catch (erro) {
        return res.status(500).json({ erro: "Erro ao buscar pergaminhos antigos." });
    }
}
// ============================================================================
// 3. CONTROLLERS DAS ROTAS
// ============================================================================
async function obterRanking(req, res) {
    try {
        const topJogadores = await Jogador.find().sort({ xp: -1 }).limit(10).select('nickname xp -_id');
        return res.status(200).json({ sucesso: true, ranking: topJogadores });
    } catch (erro) {
        return res.status(500).json({ sucesso: false, erro: "Erro ao buscar o Hall da Fama." });
    }
}

async function conversarChat(req, res) {
    try {
        const { pergunta, nickname } = req.body;
        if (!pergunta || !nickname) return res.status(400).json({ erro: "Pergunta e nickname obrigatórios." });

        const textoComNome = `[Jogador: ${nickname}] diz: ${pergunta}`;
        await Mensagem.create({ role: "user", parts: [{ text: textoComNome }] });

        // Busca do banco
const historicoBanco = await Mensagem.find().sort({ dataHora: 1 }).limit(20);

// "Limpa" os dados, recriando a lista APENAS com as propriedades que o Gemini aceita
const historico = historicoBanco.map(msg => ({
    role: msg.role,
    parts: msg.parts.map(p => ({ text: p.text })) // Tira o _id maldito daqui!
}));

        // Inicia o modelo com TUDO: Regras e as 2 Ferramentas
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction,
            tools: [ferramentasDoIA] 
        });

        const chat = model.startChat({ history: historico });
        let result = await chat.sendMessage(pergunta); // Passa apenas a pergunta original, a IA deduz o nome pelo histórico recente
        
        // =================================================================
        // 🔥 O CÉREBRO: Lidando com MÚLTIPLAS funções
        // =================================================================
        const chamadasDeFuncao = result.response.functionCalls();
        
        if (chamadasDeFuncao && chamadasDeFuncao.length > 0) {
            const respostasParaIA = [];

            // A IA pode pedir pra rodar as duas coisas de uma vez!
            for (const chamada of chamadasDeFuncao) {
                
                if (chamada.name === "adicionarXP") {
                    console.log(`🤖 IA solicitou XP para: ${chamada.args.nickname}`);
                    const resultadoBanco = await adicionarXP(chamada.args.nickname, chamada.args.quantidade);
                    respostasParaIA.push({ functionResponse: { name: "adicionarXP", response: resultadoBanco } });
                } 
                
                else if (chamada.name === "buscarClimaTempoReal") {
                    console.log(`🤖 IA solicitou Clima para: ${chamada.args.cidade}`);
                    const resultadoClima = await buscarClimaTempoReal(chamada.args.cidade);
                    respostasParaIA.push({ functionResponse: { name: "buscarClimaTempoReal", response: resultadoClima } });
                }
            }
            
            // Devolvemos todos os resultados (do banco e da API) pra IA formar a resposta final
            result = await chat.sendMessage(respostasParaIA);
        }

        const respostaDaIA = result.response.text();
        await Mensagem.create({ role: "model", parts: [{ text: respostaDaIA }] });

        return res.status(200).json({ sucesso: true, resposta: respostaDaIA });

    } catch (erro) {
        console.error("❌ Erro:", erro);
        return res.status(500).json({ erro: "Amnésia do servidor. Erro interno." });
    }
}

async function limparHistorico(req, res) {
    try {
        await Mensagem.deleteMany({});
        return res.status(200).json({ sucesso: true, mensagem: "Histórico limpo!" });
    } catch (erro) {
        return res.status(500).json({ erro: "Falha na remoção." });
    }
}

// ============================================================================
// NOVA AÇÃO: CHAT COM VISÃO (Imagem + Texto)
// ============================================================================
async function conversarComVisao(req, res) {
    try {
        // 1. Verifica se a imagem e a pergunta vieram na requisição
        const { pergunta, nickname } = req.body;
        
        if (!req.file) return res.status(400).json({ erro: "Nenhuma imagem foi enviada pelo Front-end!" });
        if (!pergunta) return res.status(400).json({ erro: "Você precisa enviar uma pergunta junto com a imagem." });

        console.log(`📸 Recebendo imagem de ${nickname}... Fazendo upload pro Cloudinary!`);

        // 2. Faz o Upload do Buffer para o Cloudinary (Usando uma Promise para podermos usar await)
        const uploadParaCloudinary = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "arena_chatbot" }, // Vai criar essa pastinha lá no seu Cloudinary
                    (erro, resultado) => {
                        if (resultado) resolve(resultado);
                        else reject(erro);
                    }
                );
                stream.end(buffer); // Joga o Buffer na correnteza (stream)
            });
        };
        
        const resultadoCloudinary = await uploadParaCloudinary(req.file.buffer);
        const urlSegura = resultadoCloudinary.secure_url; // O link da imagem salva na nuvem!

        // 3. Prepara a imagem em Base64 e o texto para enviar pro Gemini
        console.log(`🤖 Analisando imagem com o Gemini...`);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Modelo Multimodal
        
        const imagemParaGemini = {
            inlineData: {
                data: req.file.buffer.toString("base64"), // O formato que a IA da Google entende
                mimeType: req.file.mimetype // Ex: "image/jpeg"
            }
        };

        const result = await model.generateContent([pergunta, imagemParaGemini]);
        const respostaDaIA = result.response.text();

        // 4. Salva tudo no Banco de Dados (MongoDB)
        const textoComNome = `[Jogador: ${nickname || 'Anônimo'}] diz (Com Foto): ${pergunta}`;
        
        // Salva a mensagem do usuário (com a URL da foto)
        await Mensagem.create({ 
            role: "user", 
            parts: [{ text: textoComNome }],
            imagemUrl: urlSegura // 👈 Salvando o link!
        });
        
        // Salva a resposta da IA
        await Mensagem.create({ 
            role: "model", 
            parts: [{ text: respostaDaIA }] 
        });

        // 5. Devolve para o Front-end
        return res.status(200).json({ 
            sucesso: true, 
            resposta: respostaDaIA,
            urlImagem: urlSegura
        });

    } catch (erro) {
        console.error("❌ Erro na Rota da Visão:", erro);
        return res.status(500).json({ erro: "A visão do Guardião falhou. Tente novamente." });
    }
}

// Substitua o module.exports do final por este:
module.exports = { conversarChat, limparHistorico, obterRanking, conversarComVisao, obterHistorico };