// --- START OF FILE server.js ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// 1. Importação das rotas
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes'); 

// 2. Configurações Iniciais do Servidor
const app = express();
app.use(express.json()); 
app.use(cors()); 

// 🔥 TOQUE DE MESTRE: Faz o servidor hospedar a sua página HTML automaticamente!
app.use(express.static('public'));

// 3. Conectando ao Banco de Dados Nuvem (MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Conectado ao MongoDB Atlas!'))
  .catch((err) => console.error('❌ Erro no banco:', err));

// 4. Apontamento de Rotas
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes); 

// 5. Tratamento de Erros de Upload (Multer) - Critério de Aceite 4
app.use((err, req, res, next) => {
    if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ erro: "O arquivo é muito pesado! O limite é de 5MB." });
    } else if (err) {
        return res.status(400).json({ erro: err.message });
    }
    next();
});

// 6. Inicialização do Servidor
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}`);
    console.log(`🌐 Acesse seu site em: http://localhost:${PORTA}`);
});

// ... código anterior (app.use('/api/auth', authRoutes);)

// =================================================================
// 🩺 ROTA DE HEALTH CHECK (Monitoramento de Saúde e Uptime)
// =================================================================
app.get('/api/health', (req, res) => {
    try {
        // Verifica o status de conexão nativo do Mongoose
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        const isDbConnected = mongoose.connection.readyState === 1;
        
        return res.status(200).json({
            status: "ok",
            bancoDeDados: isDbConnected ? "conectado" : "desconectado",
            timestamp: new Date().toISOString()
        });
    } catch (erro) {
        return res.status(500).json({
            status: "erro",
            bancoDeDados: "falha_ao_verificar",
            mensagem: erro.message,
            timestamp: new Date().toISOString()
        });
    }
});

// No topo do server.js, junto com os outros requires:
const documentRoutes = require('./routes/documentRoutes');

// Na seção 4 (Apontamento de Rotas):
app.use('/api/chat', documentRoutes); // Isso vai criar o endpoint POST /api/chat/documento

// ... código posterior (Tratamento de Erros de Upload...)