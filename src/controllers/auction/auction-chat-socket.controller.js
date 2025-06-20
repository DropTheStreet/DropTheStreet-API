const { v4: uuidv4 } = require('uuid');
const AuctionMessageRepository = require('../../models/repositories/auction/auction_message-repository');
const { Auction } = require('../../models/models/auction/auction.model');

/**
 * Contrôleur Socket.IO pour le chat d'enchères
 */
class AuctionChatSocketController {
    constructor(io, socketHandler) {
        this.io = io;
        this.socketHandler = socketHandler;
        this.auctionParticipants = new Map(); // Stocker les participants par enchère
        this.userRateLimit = new Map(); // Rate limiting par utilisateur
    }

    /**
     * Vérifier le rate limiting pour un utilisateur
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const userLimits = this.userRateLimit.get(userId) || { count: 0, resetTime: now + 60000 };
        
        if (now > userLimits.resetTime) {
            // Reset du compteur après 1 minute
            userLimits.count = 0;
            userLimits.resetTime = now + 60000;
        }
        
        if (userLimits.count >= 10) { // Maximum 10 messages par minute
            return false;
        }
        
        userLimits.count++;
        this.userRateLimit.set(userId, userLimits);
        return true;
    }

    /**
     * Rejoindre le chat d'une enchère
     */
    async joinAuctionChat(socket, data) {
        try {
            console.log('💬 [AUCTION-CHAT] Tentative de rejoindre le chat d\'enchère:', data);

            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('auction_chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { auctionId } = data;
            if (!auctionId) {
                socket.emit('auction_chat_error', { message: 'ID d\'enchère manquant' });
                return;
            }

            // Vérifier que l'enchère existe
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                socket.emit('auction_chat_error', { message: 'Cette enchère n\'existe pas' });
                return;
            }

            // Rejoindre la salle spécifique à cette enchère
            const roomName = `auction_chat_${auctionId}`;
            socket.join(roomName);
            socket.currentAuctionChatId = auctionId;

            // Ajouter l'utilisateur à la liste des participants
            if (!this.auctionParticipants.has(auctionId)) {
                this.auctionParticipants.set(auctionId, new Set());
            }
            this.auctionParticipants.get(auctionId).add(socket.userId);

            const participantCount = this.auctionParticipants.get(auctionId).size;

            console.log(`✅ [AUCTION-CHAT] ${socket.userPseudo} a rejoint le chat de l'enchère ${auctionId}`);

            // Confirmer la connexion
            socket.emit('auction_chat_joined', {
                auctionId: auctionId,
                message: 'Vous avez rejoint le chat de l\'enchère',
                participantCount: participantCount
            });

            // Notifier les autres participants
            socket.to(roomName).emit('user_joined_auction_chat', {
                userId: socket.userId,
                pseudo: socket.userPseudo,
                auctionId: auctionId,
                participantCount: participantCount
            });

            // Envoyer l'historique récent
            try {
                const recentMessages = await AuctionMessageRepository.getRecentMessages(auctionId, 20);
                socket.emit('auction_chat_history', {
                    auctionId: auctionId,
                    messages: recentMessages,
                    isRecent: true
                });
            } catch (error) {
                console.error('Erreur lors de l\'envoi de l\'historique récent:', error);
            }

        } catch (error) {
            console.error('❌ [AUCTION-CHAT] Erreur lors de la connexion au chat d\'enchère:', error);
            socket.emit('auction_chat_error', { message: 'Erreur lors de la connexion au chat d\'enchère' });
        }
    }

    /**
     * Quitter le chat d'une enchère
     */
    async leaveAuctionChat(socket, data) {
        try {
            console.log('💬 [AUCTION-CHAT] Tentative de quitter le chat d\'enchère:', data);

            const { auctionId } = data || {};
            const targetAuctionId = auctionId || socket.currentAuctionChatId;

            if (!targetAuctionId) {
                socket.emit('auction_chat_error', { message: 'Aucun chat d\'enchère à quitter' });
                return;
            }

            const roomName = `auction_chat_${targetAuctionId}`;
            socket.leave(roomName);
            socket.currentAuctionChatId = null;

            // Retirer l'utilisateur de la liste des participants
            if (this.auctionParticipants.has(targetAuctionId)) {
                this.auctionParticipants.get(targetAuctionId).delete(socket.userId);
                
                // Nettoyer si plus de participants
                if (this.auctionParticipants.get(targetAuctionId).size === 0) {
                    this.auctionParticipants.delete(targetAuctionId);
                }
            }

            const participantCount = this.auctionParticipants.get(targetAuctionId)?.size || 0;

            console.log(`✅ [AUCTION-CHAT] ${socket.userPseudo} a quitté le chat de l'enchère ${targetAuctionId}`);

            // Confirmer la déconnexion
            socket.emit('auction_chat_left', {
                auctionId: targetAuctionId,
                message: 'Vous avez quitté le chat de l\'enchère'
            });

            // Notifier les autres participants
            socket.to(roomName).emit('user_left_auction_chat', {
                userId: socket.userId,
                auctionId: targetAuctionId,
                participantCount: participantCount
            });

        } catch (error) {
            console.error('❌ [AUCTION-CHAT] Erreur lors de la déconnexion du chat d\'enchère:', error);
            socket.emit('auction_chat_error', { message: 'Erreur lors de la déconnexion du chat d\'enchère' });
        }
    }

    /**
     * Récupérer l'historique du chat d'une enchère
     */
    async getAuctionChatHistory(socket, data) {
        try {
            console.log('📜 [AUCTION-CHAT] Récupération de l\'historique du chat d\'enchère:', data);

            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('auction_chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { auctionId, limit = 50, offset = 0 } = data;
            if (!auctionId) {
                socket.emit('auction_chat_error', { message: 'ID d\'enchère manquant' });
                return;
            }

            const messages = await AuctionMessageRepository.getAuctionChatHistory(auctionId, limit, offset);
            const hasMore = messages.length === limit;

            socket.emit('auction_chat_history', {
                auctionId: auctionId,
                messages: messages,
                hasMore: hasMore
            });

            console.log(`✅ [AUCTION-CHAT] Historique envoyé: ${messages.length} messages pour l'enchère ${auctionId}`);

        } catch (error) {
            console.error('❌ [AUCTION-CHAT] Erreur lors de la récupération de l\'historique:', error);
            socket.emit('auction_chat_error', { message: 'Impossible de récupérer l\'historique du chat' });
        }
    }

    /**
     * Envoyer un message dans le chat d'une enchère
     */
    async sendAuctionMessage(socket, messageData) {
        try {
            console.log('💬 [AUCTION-CHAT] Début sendAuctionMessage:', {
                socketId: socket.id,
                userId: socket.userId,
                messageData: messageData
            });

            if (!this.socketHandler.isUserAuthenticated(socket)) {
                console.log('❌ [AUCTION-CHAT] Utilisateur non authentifié');
                socket.emit('auction_chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { auctionId, text } = messageData;
            console.log('💬 [AUCTION-CHAT] Données du message:', { auctionId, text });

            // Validation des données
            if (!auctionId) {
                socket.emit('auction_chat_error', { message: 'ID d\'enchère manquant' });
                return;
            }

            if (!text || text.trim().length === 0) {
                socket.emit('auction_chat_error', { message: 'Le message ne peut pas être vide' });
                return;
            }

            if (text.length > 1000) {
                socket.emit('auction_chat_error', { message: 'Le message est trop long (maximum 1000 caractères)' });
                return;
            }

            // Vérifier le rate limiting
            if (!this.checkRateLimit(socket.userId)) {
                socket.emit('auction_chat_error', { message: 'Vous envoyez trop de messages. Veuillez patienter.' });
                return;
            }

            // Vérifier que l'enchère existe
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                socket.emit('auction_chat_error', { message: 'Cette enchère n\'existe pas' });
                return;
            }

            // Créer le message dans la base de données
            console.log('💬 [AUCTION-CHAT] Création du message en BDD...');
            const newMessage = await AuctionMessageRepository.create({
                id_message: uuidv4(),
                message: text.trim(),
                id_user: socket.userId,
                id_auction: auctionId
            });
            console.log('✅ [AUCTION-CHAT] Message créé:', newMessage.id_message);

            // Récupérer le message complet avec les informations utilisateur
            console.log('💬 [AUCTION-CHAT] Récupération du message complet...');
            const completeMessage = await AuctionMessageRepository.findById(newMessage.id_message);
            console.log('✅ [AUCTION-CHAT] Message complet récupéré:', completeMessage ? 'OK' : 'ERREUR');

            // Préparer les données du message pour l'envoi
            const messageToSend = {
                id_message: completeMessage.id_message,
                message: completeMessage.message,
                user: {
                    id_user: completeMessage.user?.id_user || socket.userId,
                    pseudo: completeMessage.user?.pseudo || socket.userPseudo || 'Utilisateur',
                    photo: completeMessage.user?.photo || null
                },
                auctionId: auctionId,
                timestamp: completeMessage.createdAt || completeMessage.timestamp,
                edited_at: completeMessage.edited_at
            };

            console.log('💬 [AUCTION-CHAT] Message à envoyer:', messageToSend);

            // Diffuser le message à tous les participants du chat de l'enchère
            const roomName = `auction_chat_${auctionId}`;
            this.io.to(roomName).emit('new_auction_message', messageToSend);

            console.log(`✅ [AUCTION-CHAT] Message diffusé dans la salle ${roomName}`);

        } catch (error) {
            console.error('❌ [AUCTION-CHAT] Erreur lors de l\'envoi du message:', error);
            console.error('❌ [AUCTION-CHAT] Stack trace:', error.stack);
            socket.emit('auction_chat_error', { 
                message: error.message || 'Impossible d\'envoyer le message',
                error: error.toString(),
                stack: error.stack
            });
        }
    }

    /**
     * Nettoyer les participants lors de la déconnexion
     */
    handleDisconnection(socket) {
        if (socket.currentAuctionChatId) {
            this.leaveAuctionChat(socket, { auctionId: socket.currentAuctionChatId });
        }
    }
}

module.exports = AuctionChatSocketController;
