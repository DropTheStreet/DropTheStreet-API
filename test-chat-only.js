const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Créer une application Express simple pour tester uniquement le chat
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

// Stockage en mémoire pour les tests
const chatMessages = [];
const connectedUsers = new Map();

// Route de test
app.get('/', (req, res) => {
    res.send(`
        <h1>Test Chat WebSocket Server</h1>
        <p>Le serveur de chat fonctionne sur le port ${PORT}</p>
        <p>Messages en mémoire: ${chatMessages.length}</p>
        <p>Utilisateurs connectés: ${connectedUsers.size}</p>
    `);
});

// Route pour les statistiques
app.get('/chat/stats', (req, res) => {
    res.json({
        totalMessages: chatMessages.length,
        connectedUsers: connectedUsers.size,
        serverUptime: process.uptime(),
        timestamp: new Date(),
        status: 'running'
    });
});

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log(`✅ Nouvelle connexion WebSocket: ${socket.id}`);

    // Test d'authentification simple
    socket.on('authenticate', (data) => {
        console.log(`🔐 Tentative d'authentification pour: ${socket.id}`);
        
        if (data && data.token) {
            // Simulation d'authentification réussie
            socket.authenticated = true;
            socket.userId = `user-${socket.id}`;
            socket.userEmail = `test-${socket.id}@example.com`;
            socket.userPseudo = `TestUser-${socket.id.substring(0, 4)}`;
            
            // Ajouter à la liste des connectés
            connectedUsers.set(socket.id, {
                userId: socket.userId,
                email: socket.userEmail,
                pseudo: socket.userPseudo,
                connectedAt: new Date()
            });
            
            socket.emit('authenticated', {
                message: 'Authentification réussie (mode test chat)',
                user: {
                    id: socket.userId,
                    email: socket.userEmail,
                    pseudo: socket.userPseudo
                }
            });
            
            console.log(`✅ Utilisateur authentifié: ${socket.userEmail}`);
        } else {
            socket.emit('authentication_error', {
                message: 'Token manquant ou invalide'
            });
            console.log(`❌ Échec d'authentification: ${socket.id}`);
        }
    });

    // === ROUTES DE CHAT ===
    
    // Rejoindre le chat général
    socket.on('join_general_chat', () => {
        console.log(`💬 ${socket.id} rejoint le chat général`);
        
        if (!socket.authenticated) {
            socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        socket.join('general_chat');
        socket.inGeneralChat = true;
        
        const participantCount = io.sockets.adapter.rooms.get('general_chat')?.size || 1;
        
        socket.emit('general_chat_joined', {
            message: 'Vous avez rejoint le chat général (mode test)',
            participantCount: participantCount
        });

        socket.to('general_chat').emit('user_joined_chat', {
            userId: socket.userId,
            pseudo: socket.userPseudo,
            participantCount: participantCount
        });

        // Envoyer les derniers messages
        const recentMessages = chatMessages.slice(-10); // 10 derniers messages
        socket.emit('general_chat_history', {
            messages: recentMessages,
            isRecent: true
        });

        console.log(`✅ ${socket.userPseudo} a rejoint le chat (${participantCount} participants)`);
    });

    // Quitter le chat général
    socket.on('leave_general_chat', () => {
        console.log(`💬 ${socket.id} quitte le chat général`);
        
        socket.leave('general_chat');
        socket.inGeneralChat = false;
        
        const participantCount = io.sockets.adapter.rooms.get('general_chat')?.size || 0;
        
        socket.emit('general_chat_left', {
            message: 'Vous avez quitté le chat général'
        });

        socket.to('general_chat').emit('user_left_chat', {
            userId: socket.userId,
            participantCount: participantCount
        });

        console.log(`✅ ${socket.userPseudo} a quitté le chat`);
    });

    // Envoyer un message
    socket.on('send_general_message', (messageData) => {
        console.log(`💬 [DEBUG] Message reçu de ${socket.id}:`, {
            socketId: socket.id,
            userId: socket.userId,
            userPseudo: socket.userPseudo,
            authenticated: socket.authenticated,
            inGeneralChat: socket.inGeneralChat,
            messageData: messageData
        });
        
        if (!socket.authenticated) {
            console.log('❌ Utilisateur non authentifié');
            socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!socket.inGeneralChat) {
            console.log('❌ Utilisateur pas dans le chat');
            socket.emit('chat_error', { message: 'Vous devez rejoindre le chat d\'abord' });
            return;
        }

        if (!messageData || !messageData.text || messageData.text.trim().length === 0) {
            console.log('❌ Message vide');
            socket.emit('chat_error', { message: 'Le message ne peut pas être vide' });
            return;
        }

        if (messageData.text.length > 1000) {
            console.log('❌ Message trop long');
            socket.emit('chat_error', { message: 'Le message est trop long (maximum 1000 caractères)' });
            return;
        }

        const newMessage = {
            id_message: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message: messageData.text.trim(),
            user: {
                id_user: socket.userId,
                pseudo: socket.userPseudo,
                photo: null
            },
            timestamp: new Date(),
            createdAt: new Date()
        };

        // Stocker le message en mémoire
        chatMessages.push(newMessage);
        
        // Garder seulement les 100 derniers messages
        if (chatMessages.length > 100) {
            chatMessages.shift();
        }

        console.log(`✅ Message envoyé par ${socket.userPseudo}: "${messageData.text.substring(0, 50)}..."`);

        // Diffuser le message à tous les participants
        io.to('general_chat').emit('new_general_message', newMessage);
    });

    // Récupérer l'historique
    socket.on('get_general_chat_history', (data) => {
        console.log(`📜 Historique demandé par ${socket.id}`);
        
        if (!socket.authenticated) {
            socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        const limit = data?.limit || 50;
        const offset = data?.offset || 0;
        
        const messages = chatMessages.slice(-limit); // Derniers messages

        socket.emit('general_chat_history', {
            messages: messages,
            hasMore: false
        });

        console.log(`✅ Historique envoyé: ${messages.length} messages`);
    });

    // Statistiques du chat
    socket.on('get_chat_stats', () => {
        console.log(`📊 Statistiques demandées par ${socket.id}`);
        
        if (!socket.authenticated) {
            socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        const stats = {
            totalMessages: chatMessages.length,
            todayMessages: chatMessages.filter(msg => {
                const today = new Date();
                const msgDate = new Date(msg.timestamp);
                return msgDate.toDateString() === today.toDateString();
            }).length,
            activeUsers: connectedUsers.size,
            onlineParticipants: io.sockets.adapter.rooms.get('general_chat')?.size || 0
        };

        socket.emit('chat_stats', stats);
        console.log(`✅ Statistiques envoyées:`, stats);
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        console.log(`❌ Déconnexion WebSocket: ${socket.id}`);
        
        // Retirer de la liste des connectés
        connectedUsers.delete(socket.id);
        
        // Notifier le chat si l'utilisateur était dedans
        if (socket.inGeneralChat) {
            const participantCount = io.sockets.adapter.rooms.get('general_chat')?.size || 0;
            socket.to('general_chat').emit('user_left_chat', {
                userId: socket.userId,
                participantCount: participantCount
            });
        }
    });

    // Gestion des erreurs
    socket.on('error', (error) => {
        console.error(`❌ Erreur WebSocket ${socket.id}:`, error);
    });
});

// Démarrer le serveur
server.listen(PORT, () => {
    console.log('🚀 Serveur de test Chat WebSocket démarré !');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log('');
    console.log('💡 Pour tester:');
    console.log('   1. Ouvrez test-websocket-client.html dans votre navigateur');
    console.log('   2. Connectez-vous au serveur');
    console.log('   3. Utilisez n\'importe quel token pour l\'authentification');
    console.log('   4. Testez les fonctionnalités de chat');
    console.log('');
    console.log('📊 Statistiques: http://localhost:' + PORT + '/chat/stats');
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur (SIGTERM)...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});
