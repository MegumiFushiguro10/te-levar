// 1. Carrega o sistema de segurança (lê o arquivo .env)
require('dotenv').config();

// 2. Importa a biblioteca do Google Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 3. Verifica se a chave foi carregada corretamente
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ ERRO: Chave da API não encontrada. Verifique seu arquivo .env!");
    process.exit(1);
}

// 4. Conecta com a IA usando a sua chave secreta
const genAI = new GoogleGenerativeAI(apiKey);

async function executarAgente() {
    try {
        console.log("⏳ Conectando aos servidores do Google...");

        // CORREÇÃO: O modelo mais rápido atual é o 1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 6. ENGENHARIA DE PROMPT (Sem erros de sintaxe agora)
        const prompt = "Aja como Satoru Gojo, o feiticeiro mais forte de Jujutsu Kaisen. Com sua personalidade extremamente autoconfiante, descontraída e chamando o usuário de 'meu aluno', explique o que é o 'Back-end' na programação. Faça uma analogia dizendo que o Front-end é o que as pessoas veem, mas o Back-end é como a sua técnica do 'Infinito' ou a sua 'Expansão de Domínio: Vazio Imensurável' – onde o verdadeiro poder e processamento acontecem nos bastidores. Comece a resposta com um clássico 'Yo!'";
        
        // 7. Envia a pergunta e espera (await) a resposta
        const result = await model.generateContent(prompt);
        const resposta = result.response.text();

        console.log("\n🤖 [AGENTE GEMINI]:");
        console.log(resposta);
        console.log("\n✅ Missão Concluída.");

    } catch (erro) {
        console.error("❌ Ocorreu um erro na conexão:", erro.message);
    }
}

// Roda o sistema
executarAgente();