const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Message } = require('./models/message.model'); // Ajustez le chemin selon votre structure
const { User } = require('./models/user.model'); // Ajustez le chemin selon votre structure

// Créer une application Express simple
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

// Route de test
app.get('/', (req, res) => {
    res.send(`
        <h1>Test WebSocket Server</h1>
        <p>Le serveur WebSocket fonctionne sur le port ${PORT}</p>
        <p>Utilisez le client de test pour vous connecter.</p>
    `);
});

// Route pour les statistiques
app.get('/socket/stats', (req, res) => {
    const connectedClients = io.engine.clientsCount;
    res.json({
        connectedUsers: connectedClients,
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
            socket.userEmail = 'test@example.com';
            
            socket.emit('authenticated', {
                message: 'Authentification réussie (mode test)',
                user: {
                    id: 'test-user-id',
                    email: 'test@example.com'
                }
            });
            
            console.log(`✅ Utilisateur authentifié: ${socket.id}`);
        } else {
            socket.emit('authentication_error', {
                message: 'Token manquant ou invalide'
            });
            console.log(`❌ Échec d'authentification: ${socket.id}`);
        }
    });

    // Test de rejoindre une "enchère"
    socket.on('join_auction', (data) => {
        console.log(`🏠 Tentative de rejoindre l'enchère: ${data.auctionId} par ${socket.id}`);
        
        if (!socket.authenticated) {
            socket.emit('auction_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!data.auctionId) {
            socket.emit('auction_error', { message: 'ID d\'enchère manquant' });
            return;
        }

        // Rejoindre la salle
        const roomName = `auction_${data.auctionId}`;
        socket.join(roomName);
        
        // Confirmer la connexion
        socket.emit('auction_joined', {
            auctionId: data.auctionId,
            message: 'Vous avez rejoint l\'enchère (mode test)',
            participantCount: io.sockets.adapter.rooms.get(roomName)?.size || 1
        });

        // Notifier les autres participants
        socket.to(roomName).emit('user_joined_auction', {
            userId: socket.id,
            email: socket.userEmail,
            participantCount: io.sockets.adapter.rooms.get(roomName)?.size || 1
        });

        console.log(`✅ ${socket.id} a rejoint l'enchère ${data.auctionId}`);
    });

    // Test de placement d'enchère
    socket.on('place_bid', (data) => {
        console.log(`💰 Tentative d'enchère: ${data.bidAmount}€ sur ${data.auctionId} par ${socket.id}`);
        
        if (!socket.authenticated) {
            socket.emit('bid_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!data.auctionId || !data.bidAmount) {
            socket.emit('bid_error', { message: 'Données d\'enchère manquantes' });
            return;
        }

        // Simuler une enchère réussie
        const bidData = {
            auctionId: data.auctionId,
            bidAmount: data.bidAmount,
            userId: socket.id,
            userEmail: socket.userEmail,
            timestamp: new Date(),
            currentPrice: data.bidAmount
        };

        // Confirmer l'enchère
        socket.emit('bid_placed', {
            ...bidData,
            message: 'Votre enchère a été placée avec succès (mode test)'
        });

        // Notifier les autres participants
        const roomName = `auction_${data.auctionId}`;
        socket.to(roomName).emit('new_bid', bidData);

        console.log(`✅ Enchère placée: ${data.bidAmount}€ par ${socket.id}`);
    });

    // Test de récupération des enchères actives
    socket.on('get_active_auctions', () => {
        console.log(`📋 Récupération des enchères actives par ${socket.id}`);

        if (!socket.authenticated) {
            socket.emit('auctions_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        // Simuler des enchères actives
        const mockAuctions = [
            {
                id_auction: 'test-auction-1',
                initial_price: 100,
                actual_price: 150,
                start_date: new Date(Date.now() - 3600000), // Il y a 1 heure
                end_date: new Date(Date.now() + 3600000),   // Dans 1 heure
                participantCount: 3
            },
            {
                id_auction: 'test-auction-2',
                initial_price: 200,
                actual_price: 250,
                start_date: new Date(Date.now() - 1800000), // Il y a 30 min
                end_date: new Date(Date.now() + 1800000),   // Dans 30 min
                participantCount: 5
            }
        ];

        socket.emit('active_auctions', {
            auctions: mockAuctions,
            count: mockAuctions.length
        });

        console.log(`✅ Enchères actives envoyées à ${socket.id}`);
    });

    // === ROUTES DE CHAT GÉNÉRAL (MODE TEST) ===

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
            userId: socket.id,
            pseudo: socket.userEmail,
            participantCount: participantCount
        });

        // Envoyer un historique de test
        const mockHistory = [
            {
                id_message: 'msg-1',
                message: 'Bienvenue dans le chat de test !',
                user: { pseudo: 'TestBot', id_user: 'bot-1' },
                createdAt: new Date(Date.now() - 300000)
            },
            {
                id_message: 'msg-2',
                message: 'N\'hésitez pas à tester les fonctionnalités',
                user: { pseudo: 'TestBot', id_user: 'bot-1' },
                createdAt: new Date(Date.now() - 120000)
            }
        ];

        socket.emit('general_chat_history', {
            messages: mockHistory,
            isRecent: true
        });
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
            userId: socket.id,
            participantCount: participantCount
        });
    });

    // Envoyer un message
    socket.on('send_general_message', async (messageData) => {
        console.log(`💬 Message de ${socket.id}: ${messageData.text}`);

        if (!socket.authenticated || !socket.inGeneralChat) {
            socket.emit('chat_error', { message: 'Vous devez être connecté au chat' });
            return;
        }

        if (!messageData.text || messageData.text.trim().length === 0) {
            socket.emit('chat_error', { message: 'Le message ne peut pas être vide' });
            return;
        }

        try {
            // Enregistrer le message en base de données
            const newMessage = await Message.create({
                message: messageData.text.trim(),
                id_user: socket.id_user, // Assurez-vous que cette propriété est définie lors de l'authentification
                createdAt: new Date()
            });

            // Récupérer les informations de l'utilisateur pour l'inclure dans la réponse
            const user = await User.findByPk(socket.id_user);

            const messageToSend = {
                id_message: newMessage.id_message,
                message: newMessage.message,
                user: {
                    id_user: user.id_user,
                    pseudo: user.pseudo
                },
                createdAt: newMessage.createdAt
            };

            // Diffuser le message à tous les participants
            io.to('general_chat').emit('new_general_message', messageToSend);

            console.log(`✅ Message enregistré en BDD et diffusé: ${messageData.text}`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement du message:', error);
            socket.emit('chat_error', { message: 'Erreur lors de l\'envoi du message' });
        }
    });

    // Récupérer l'historique
    socket.on('get_general_chat_history', () => {
        console.log(`📜 Historique demandé par ${socket.id}`);

        if (!socket.authenticated) {
            socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        const mockHistory = [
            {
                id_message: 'msg-1',
                message: 'Historique de test - Message 1',
                user: { pseudo: 'TestUser1', id_user: 'user-1' },
                createdAt: new Date(Date.now() - 600000)
            },
            {
                id_message: 'msg-2',
                message: 'Historique de test - Message 2',
                user: { pseudo: 'TestUser2', id_user: 'user-2' },
                createdAt: new Date(Date.now() - 300000)
            }
        ];

        socket.emit('general_chat_history', {
            messages: mockHistory,
            hasMore: false
        });
    });

    // Quitter une enchère
    socket.on('leave_auction', (data) => {
        if (data.auctionId) {
            const roomName = `auction_${data.auctionId}`;
            socket.leave(roomName);
            
            socket.emit('auction_left', {
                auctionId: data.auctionId,
                message: 'Vous avez quitté l\'enchère'
            });

            socket.to(roomName).emit('user_left_auction', {
                userId: socket.id,
                participantCount: io.sockets.adapter.rooms.get(roomName)?.size || 0
            });

            console.log(`🚪 ${socket.id} a quitté l'enchère ${data.auctionId}`);
        }
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        console.log(`❌ Déconnexion WebSocket: ${socket.id}`);
    });

    // Gestion des erreurs
    socket.on('error', (error) => {
        console.error(`❌ Erreur WebSocket ${socket.id}:`, error);
    });
});

// Démarrer le serveur
server.listen(PORT, () => {
    console.log('🚀 Serveur de test WebSocket démarré !');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log('');
    console.log('💡 Pour tester:');
    console.log('   1. Ouvrez test-websocket-client.html dans votre navigateur');
    console.log('   2. Connectez-vous au serveur');
    console.log('   3. Utilisez n\'importe quel token pour l\'authentification');
    console.log('   4. Testez les fonctionnalités d\'enchères');
    console.log('');
    console.log('📊 Statistiques: http://localhost:' + PORT + '/socket/stats');
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
