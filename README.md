# 🛡️ SaaS AI Chatbot - Guardião Multimodal

Um Software as a Service (SaaS) completo, construído como um Chatbot inteligente que atua como o "Guardião da Arena". Ele possui visão computacional, memória de longo prazo, sistema de pontuação e habilidades de buscar dados externos em tempo real.

## 🚀 Funcionalidades Principais

- **Autenticação Segura (JWT):** Sistema de Login e Cadastro com criptografia de senhas (Bcrypt).
- **IA Multimodal (Gemini 2.0 Flash):** Capacidade de conversar por texto e analisar imagens enviadas pelo usuário.
- **Function Calling (Ações no Mundo Real):** A IA decide autonomamente quando consultar a API de clima em tempo real ou quando dar/tirar XP do banco de dados.
- **Armazenamento em Nuvem (Cloudinary):** Upload de arquivos e processamento de imagens via `multer`.
- **Leaderboard Global:** Sistema de ranking (Hall da Fama) em tempo real buscando os jogadores com mais XP no banco de dados.
- **Health Check Endpoint:** Rota embutida de monitoramento de saúde do servidor e banco de dados.

## 🛠️ Tecnologias Utilizadas

**Front-end:**
- HTML5, CSS3, Vanilla JavaScript
- Fetch API (Comunicações Assíncronas e Envio de FormData)

**Back-end:**
- Node.js & Express
- Autenticação e Segurança: JSON Web Tokens (JWT) e Bcrypt.js
- Inteligência Artificial: Google Generative AI SDK (Gemini)
- Banco de Dados: MongoDB (Atlas Cloud) e Mongoose ORM
- Uploads: Multer e Cloudinary SDK

## ⚙️ Como rodar o projeto localment
