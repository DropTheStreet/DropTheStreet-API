const jwt = require('jsonwebtoken');
const { User } = require('../models/models/user/user.model');
const AuctionSocketController = require('../controllers/auction/auction-socket.controller');
const ChatSocketController = require('../controllers/chat/chat-socket.controller');
const AuctionChatSocketController = require('../controllers/auction/auction-chat-socket.controller');
const DropChatSocketController = require('../controllers/drop/drop-chat-socket.controller');

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.connectedUsers = new Map(); // Map pour stocker les utilisateurs connectés
        this.auctionRooms = new Map(); // Map pour stocker les salles d'enchères
        this.auctionSocketController = new AuctionSocketController(io, this);
        this.chatSocketController = new ChatSocketController(io, this);
        this.auctionChatSocketController = new AuctionChatSocketController(io, this);
        this.dropChatSocketController = new DropChatSocketController(io, this);
        this.initializeSocketEvents();
    }

    initializeSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log(`🔗 [${new Date().toISOString()}] Nouvelle connexion WebSocket: ${socket.id}`);

            // Authentification du socket
            socket.on('authenticate', async (data) => {
                try {
                    await this.authenticateUser(socket, data.token);
                } catch (error) {
                    console.error('Erreur d\'authentification:', error);
                    socket.emit('authentication_error', { message: 'Token invalide' });
                    socket.disconnect();
                }
            });

            // Rejoindre une salle d'enchère
            socket.on('join_auction', async (data) => {
                try {
                    await this.auctionSocketController.joinAuction(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la connexion à l\'enchère:', error);
                    socket.emit('auction_error', { message: 'Impossible de rejoindre l\'enchère' });
                }
            });

            // Rejoindre une salle d'enchère (nouveau)
            socket.on('join_auction_room', async (data) => {
                try {
                    await this.auctionSocketController.joinAuctionRoom(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la connexion à la salle d\'enchère:', error);
                    socket.emit('auction_error', { message: 'Impossible de rejoindre la salle d\'enchère' });
                }
            });

            // S'abonner aux mises à jour d'enchères (nouveau)
            socket.on('subscribe_to_auction_updates', async (data) => {
                try {
                    await this.auctionSocketController.subscribeToAuctionUpdates(socket, data);
                } catch (error) {
                    console.error('Erreur lors de l\'abonnement aux mises à jour:', error);
                    socket.emit('auction_error', { message: 'Impossible de s\'abonner aux mises à jour' });
                }
            });

            // Quitter une salle d'enchère
            socket.on('leave_auction', async (data) => {
                try {
                    await this.auctionSocketController.leaveAuction(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la déconnexion de l\'enchère:', error);
                }
            });

            // Placer une enchère
            socket.on('place_bid', async (data) => {
                try {
                    await this.auctionSocketController.placeBid(socket, data);
                } catch (error) {
                    console.error('Erreur lors de l\'enchère:', error);
                    socket.emit('bid_error', { message: 'Impossible de placer l\'enchère' });
                }
            });

            // Obtenir les enchères actives
            socket.on('get_active_auctions', async () => {
                try {
                    await this.auctionSocketController.getActiveAuctions(socket);
                } catch (error) {
                    console.error('Erreur lors de la récupération des enchères:', error);
                    socket.emit('auctions_error', { message: 'Impossible de récupérer les enchères' });
                }
            });

            // Récupérer l'historique des enchères
            socket.on('get_bid_history', async (data) => {
                try {
                    await this.auctionSocketController.getBidHistory(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la récupération de l\'historique des enchères:', error);
                    socket.emit('auction_error', { message: 'Impossible de récupérer l\'historique des enchères' });
                }
            });

            // === ROUTES DE CHAT GÉNÉRAL ===

            // Rejoindre le chat général
            socket.on('join_general_chat', async () => {
                try {
                    await this.chatSocketController.joinGeneralChat(socket);
                } catch (error) {
                    console.error('Erreur lors de la connexion au chat général:', error);
                    socket.emit('chat_error', { message: 'Impossible de rejoindre le chat général' });
                }
            });

            // Quitter le chat général
            socket.on('leave_general_chat', async () => {
                try {
                    await this.chatSocketController.leaveGeneralChat(socket);
                } catch (error) {
                    console.error('Erreur lors de la déconnexion du chat général:', error);
                }
            });

            // Récupérer l'historique du chat général
            socket.on('get_general_chat_history', async (data) => {
                try {
                    await this.chatSocketController.getChatHistory(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la récupération de l\'historique:', error);
                    socket.emit('chat_error', { message: 'Impossible de récupérer l\'historique du chat' });
                }
            });

            // Envoyer un message dans le chat général
            socket.on('send_general_message', async (messageData) => {
                try {
                    console.log('💬 [SOCKET-HANDLER] Réception message:', messageData);
                    console.log('💬 [SOCKET-HANDLER] Socket info:', {
                        socketId: socket.id,
                        userId: socket.userId,
                        authenticated: socket.authenticated
                    });

                    // Appel correct de la méthode (un seul paramètre messageData)
                    await this.chatSocketController.sendGeneralMessage(socket, messageData);
                } catch (error) {
                    console.error('❌ [SOCKET-HANDLER] Erreur lors de l\'envoi du message:', error);
                    console.error('❌ [SOCKET-HANDLER] Stack trace:', error.stack);
                    socket.emit('chat_error', {
                        message: error.message || 'Impossible d\'envoyer le message',
                        source: 'socket-handler',
                        error: error.toString()
                    });
                }
            });

            // Modifier un message
            socket.on('edit_message', async (data) => {
                try {
                    await this.chatSocketController.editMessage(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la modification du message:', error);
                    socket.emit('chat_error', { message: 'Impossible de modifier le message' });
                }
            });

            // Supprimer un message
            socket.on('delete_message', async (data) => {
                try {
                    await this.chatSocketController.deleteMessage(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la suppression du message:', error);
                    socket.emit('chat_error', { message: 'Impossible de supprimer le message' });
                }
            });

            // Rechercher des messages
            socket.on('search_messages', async (data) => {
                try {
                    await this.chatSocketController.searchMessages(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la recherche:', error);
                    socket.emit('chat_error', { message: 'Erreur lors de la recherche' });
                }
            });

            // Obtenir les statistiques du chat
            socket.on('get_chat_stats', async () => {
                try {
                    await this.chatSocketController.getChatStats(socket);
                } catch (error) {
                    console.error('Erreur lors de la récupération des statistiques:', error);
                    socket.emit('chat_error', { message: 'Impossible de récupérer les statistiques' });
                }
            });

            // === ÉVÉNEMENTS DE CHAT D'ENCHÈRES ===

            // Rejoindre le chat d'une enchère spécifique
            socket.on('join_auction_chat', async (data) => {
                try {
                    await this.auctionChatSocketController.joinAuctionChat(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la connexion au chat d\'enchère:', error);
                    socket.emit('auction_chat_error', { message: 'Impossible de rejoindre le chat d\'enchère' });
                }
            });

            // Quitter le chat d'une enchère
            socket.on('leave_auction_chat', async (data) => {
                try {
                    await this.auctionChatSocketController.leaveAuctionChat(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la déconnexion du chat d\'enchère:', error);
                    socket.emit('auction_chat_error', { message: 'Impossible de quitter le chat d\'enchère' });
                }
            });

            // Récupérer l'historique du chat d'une enchère
            socket.on('get_auction_chat_history', async (data) => {
                try {
                    await this.auctionChatSocketController.getAuctionChatHistory(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la récupération de l\'historique du chat d\'enchère:', error);
                    socket.emit('auction_chat_error', { message: 'Impossible de récupérer l\'historique du chat' });
                }
            });

            // Envoyer un message dans le chat d'une enchère
            socket.on('send_auction_message', async (messageData) => {
                try {
                    console.log('💬 [SOCKET-HANDLER] Réception message d\'enchère:', messageData);
                    await this.auctionChatSocketController.sendAuctionMessage(socket, messageData);
                } catch (error) {
                    console.error('❌ [SOCKET-HANDLER] Erreur lors de l\'envoi du message d\'enchère:', error);
                    socket.emit('auction_chat_error', {
                        message: error.message || 'Impossible d\'envoyer le message',
                        source: 'socket-handler',
                        error: error.toString()
                    });
                }
            });

            // === ÉVÉNEMENTS DE CHAT DE DROPS ===

            // Rejoindre le chat d'un drop spécifique
            socket.on('join_drop_chat', async (data) => {
                try {
                    await this.dropChatSocketController.joinDropChat(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la connexion au chat de drop:', error);
                    socket.emit('drop_chat_error', { message: 'Impossible de rejoindre le chat de drop' });
                }
            });

            // Quitter le chat d'un drop
            socket.on('leave_drop_chat', async (data) => {
                try {
                    await this.dropChatSocketController.leaveDropChat(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la déconnexion du chat de drop:', error);
                    socket.emit('drop_chat_error', { message: 'Impossible de quitter le chat de drop' });
                }
            });

            // Récupérer l'historique du chat d'un drop
            socket.on('get_drop_chat_history', async (data) => {
                try {
                    await this.dropChatSocketController.getDropChatHistory(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la récupération de l\'historique du chat de drop:', error);
                    socket.emit('drop_chat_error', { message: 'Impossible de récupérer l\'historique du chat' });
                }
            });

            // Envoyer un message dans le chat d'un drop
            socket.on('send_drop_message', async (messageData) => {
                try {
                    console.log('💬 [SOCKET-HANDLER] Réception message de drop:', messageData);
                    await this.dropChatSocketController.sendDropMessage(socket, messageData);
                } catch (error) {
                    console.error('❌ [SOCKET-HANDLER] Erreur lors de l\'envoi du message de drop:', error);
                    socket.emit('drop_chat_error', {
                        message: error.message || 'Impossible d\'envoyer le message',
                        source: 'socket-handler',
                        error: error.toString()
                    });
                }
            });

            // Obtenir les statistiques du chat d'un drop
            socket.on('get_drop_chat_stats', async (data) => {
                try {
                    await this.dropChatSocketController.getDropChatStats(socket, data);
                } catch (error) {
                    console.error('Erreur lors de la récupération des statistiques du chat de drop:', error);
                    socket.emit('drop_chat_error', { message: 'Impossible de récupérer les statistiques' });
                }
            });

            // Déconnexion
            socket.on('disconnect', () => {
                this.handleDisconnection(socket);
            });

            // Gestion des erreurs
            socket.on('error', (error) => {
                console.error('Erreur WebSocket:', error);
            });
        });
    }

    async authenticateUser(socket, token) {
        if (!token) {
            throw new Error('Token manquant');
        }

        try {
            // MODE TEST : Si le token est "test", créer un utilisateur fictif
            if (token === 'test' || token === 'test123') {
                console.log('🧪 Mode test activé - Utilisateur fictif créé');
                const testUser = {
                    id_user: `test-user-${socket.id}`,
                    email: `test-${socket.id}@example.com`,
                    pseudo: `TestUser-${socket.id.substring(0, 4)}`
                };

                // Stocker les informations de l'utilisateur dans le socket
                socket.userId = testUser.id_user;
                socket.userEmail = testUser.email;
                socket.userPseudo = testUser.pseudo;
                socket.authenticated = true;

                // Ajouter l'utilisateur à la liste des connectés
                this.connectedUsers.set(socket.id, {
                    userId: testUser.id_user,
                    email: testUser.email,
                    socketId: socket.id,
                    connectedAt: new Date()
                });

                console.log(`✅ Utilisateur de test authentifié: ${testUser.email}`);

                // Confirmer l'authentification
                socket.emit('authenticated', {
                    message: 'Authentification réussie (mode test)',
                    user: {
                        id: testUser.id_user,
                        email: testUser.email,
                        pseudo: testUser.pseudo
                    }
                });
                return;
            }

            // Vérifier le token JWT
            console.log('🔐 Vérification du token JWT:', token);
            const decoded = jwt.verify(token, process.env.SECRET_KEY);

            // Récupérer l'utilisateur depuis la base de données
            const user = await User.findByPk(decoded.id_user);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Stocker les informations de l'utilisateur dans le socket
            socket.userId = user.id_user;
            socket.userEmail = user.email;
            socket.userPseudo = user.pseudo;
            socket.authenticated = true;

            // Ajouter l'utilisateur à la liste des connectés
            this.connectedUsers.set(socket.id, {
                userId: user.id_user,
                email: user.email,
                socketId: socket.id,
                connectedAt: new Date()
            });

            console.log(`Utilisateur authentifié: ${user.email} (${socket.id})`);
            
            // Confirmer l'authentification
            socket.emit('authenticated', {
                message: 'Authentification réussie',
                user: {
                    id: user.id_user,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            throw error;
        }
    }

    handleDisconnection(socket) {
        console.log(`Déconnexion WebSocket: ${socket.id}`);

        // Retirer l'utilisateur de la liste des connectés
        this.connectedUsers.delete(socket.id);

        // Retirer l'utilisateur de toutes les salles d'enchères
        this.auctionRooms.forEach((room, auctionId) => {
            if (room.participants.has(socket.id)) {
                room.participants.delete(socket.id);

                // Notifier les autres participants
                socket.to(`auction_${auctionId}`).emit('user_left_auction', {
                    userId: socket.userId,
                    participantCount: room.participants.size
                });

                console.log(`Utilisateur ${socket.userId} a quitté l'enchère ${auctionId}`);
            }
        });

        // Retirer l'utilisateur du chat général
        if (this.chatSocketController.chatParticipants.has(socket.id)) {
            this.chatSocketController.chatParticipants.delete(socket.id);

            // Notifier les autres participants du chat
            socket.to('general_chat').emit('user_left_chat', {
                userId: socket.userId,
                participantCount: this.chatSocketController.chatParticipants.size
            });

            console.log(`Utilisateur ${socket.userId} a quitté le chat général`);
        }

        // Nettoyer les participants du chat
        this.chatSocketController.cleanupDisconnectedUsers();

        // Nettoyer les chats d'enchères
        this.auctionChatSocketController.handleDisconnection(socket);

        // Nettoyer les chats de drops
        this.dropChatSocketController.handleDisconnection(socket);
    }

    // Méthodes utilitaires
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    getAuctionParticipants(auctionId) {
        const room = this.auctionRooms.get(auctionId);
        return room ? room.participants.size : 0;
    }

    broadcastToAuction(auctionId, event, data) {
        this.io.to(`auction_${auctionId}`).emit(event, data);
    }

    isUserAuthenticated(socket) {
        console.log(socket.auth + ' ' + socket.userId);
        return socket.authenticated === true && socket.userId;
    }

    getUserSocket(userId) {
        for (const [socketId, userData] of this.connectedUsers) {
            if (userData.userId === userId) {
                return this.io.sockets.sockets.get(socketId);
            }
        }
        return null;
    }

    // Méthode pour créer ou récupérer une salle d'enchère
    getOrCreateAuctionRoom(auctionId) {
        if (!this.auctionRooms.has(auctionId)) {
            this.auctionRooms.set(auctionId, {
                auctionId: auctionId,
                participants: new Map(),
                createdAt: new Date(),
                lastActivity: new Date()
            });
        }
        return this.auctionRooms.get(auctionId);
    }

    // Nettoyer les salles vides
    cleanupEmptyRooms() {
        this.auctionRooms.forEach((room, auctionId) => {
            if (room.participants.size === 0) {
                this.auctionRooms.delete(auctionId);
                console.log(`Salle d'enchère ${auctionId} supprimée (vide)`);
            }
        });
    }
}

module.exports = SocketHandler;
