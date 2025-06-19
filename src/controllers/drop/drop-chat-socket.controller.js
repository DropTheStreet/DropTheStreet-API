const { v4: uuidv4 } = require('uuid');
const DropMessageRepository = require('../../models/repositories/drop/drop_message-repository');
const { Drop } = require('../../models/models/drop/drop.model');

/**
 * Contrôleur Socket.IO pour le chat de drops
 */
class DropChatSocketController {
    constructor(io, socketHandler) {
        this.io = io;
        this.socketHandler = socketHandler;
        this.dropParticipants = new Map(); // Stocker les participants par drop
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
     * Rejoindre le chat d'un drop
     */
    async joinDropChat(socket, data) {
        try {
            console.log('💬 [DROP-CHAT] Tentative de rejoindre le chat de drop:', data);

            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('drop_chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { dropId } = data;
            if (!dropId) {
                socket.emit('drop_chat_error', { message: 'ID de drop manquant' });
                return;
            }

            // Vérifier que le drop existe
            const drop = await Drop.findByPk(dropId);
            if (!drop) {
                socket.emit('drop_chat_error', { message: 'Ce drop n\'existe pas' });
                return;
            }

            // Rejoindre la salle spécifique à ce drop
            const roomName = `drop_chat_${dropId}`;
            socket.join(roomName);
            socket.currentDropChatId = dropId;

            // Ajouter l'utilisateur à la liste des participants
            if (!this.dropParticipants.has(dropId)) {
                this.dropParticipants.set(dropId, new Set());
            }
            this.dropParticipants.get(dropId).add(socket.userId);

            const participantCount = this.dropParticipants.get(dropId).size;

            console.log(`✅ [DROP-CHAT] ${socket.userPseudo} a rejoint le chat du drop ${dropId}`);

            // Confirmer la connexion
            socket.emit('drop_chat_joined', {
                dropId: dropId,
                message: 'Vous avez rejoint le chat du drop',
                participantCount: participantCount
            });

            // Notifier les autres participants
            socket.to(roomName).emit('user_joined_drop_chat', {
                userId: socket.userId,
                pseudo: socket.userPseudo,
                dropId: dropId,
                participantCount: participantCount
            });

            // Envoyer l'historique récent
            try {
                const recentMessages = await DropMessageRepository.getRecentMessages(dropId, 20);
                socket.emit('drop_chat_history', {
                    dropId: dropId,
                    messages: recentMessages,
                    isRecent: true
                });
            } catch (error) {
                console.error('Erreur lors de l\'envoi de l\'historique récent:', error);
            }

        } catch (error) {
            console.error('❌ [DROP-CHAT] Erreur lors de la connexion au chat de drop:', error);
            socket.emit('drop_chat_error', { message: 'Erreur lors de la connexion au chat de drop' });
        }
    }

    /**
     * Quitter le chat d'un drop
     */
    async leaveDropChat(socket, data) {
        try {
            console.log('💬 [DROP-CHAT] Tentative de quitter le chat de drop:', data);

            const { dropId } = data || {};
            const targetDropId = dropId || socket.currentDropChatId;

            if (!targetDropId) {
                socket.emit('drop_chat_error', { message: 'Aucun chat de drop à quitter' });
                return;
            }

            const roomName = `drop_chat_${targetDropId}`;
            socket.leave(roomName);
            socket.currentDropChatId = null;

            // Retirer l'utilisateur de la liste des participants
            if (this.dropParticipants.has(targetDropId)) {
                this.dropParticipants.get(targetDropId).delete(socket.userId);
                
                // Nettoyer si plus de participants
                if (this.dropParticipants.get(targetDropId).size === 0) {
                    this.dropParticipants.delete(targetDropId);
                }
            }

            const participantCount = this.dropParticipants.get(targetDropId)?.size || 0;

            console.log(`✅ [DROP-CHAT] ${socket.userPseudo} a quitté le chat du drop ${targetDropId}`);

            // Confirmer la déconnexion
            socket.emit('drop_chat_left', {
                dropId: targetDropId,
                message: 'Vous avez quitté le chat du drop'
            });

            // Notifier les autres participants
            socket.to(roomName).emit('user_left_drop_chat', {
                userId: socket.userId,
                dropId: targetDropId,
                participantCount: participantCount
            });

        } catch (error) {
            console.error('❌ [DROP-CHAT] Erreur lors de la déconnexion du chat de drop:', error);
            socket.emit('drop_chat_error', { message: 'Erreur lors de la déconnexion du chat de drop' });
        }
    }

    /**
     * Récupérer l'historique du chat d'un drop
     */
    async getDropChatHistory(socket, data) {
        try {
            console.log('📜 [DROP-CHAT] Récupération de l\'historique du chat de drop:', data);

            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('drop_chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { dropId, limit = 50, offset = 0 } = data;
            if (!dropId) {
                socket.emit('drop_chat_error', { message: 'ID de drop manquant' });
                return;
            }

            const messages = await DropMessageRepository.getDropChatHistory(dropId, limit, offset);
            const hasMore = messages.length === limit;

            socket.emit('drop_chat_history', {
                dropId: dropId,
                messages: messages,
                hasMore: hasMore
            });

            console.log(`✅ [DROP-CHAT] Historique envoyé: ${messages.length} messages pour le drop ${dropId}`);

        } catch (error) {
            console.error('❌ [DROP-CHAT] Erreur lors de la récupération de l\'historique:', error);
            socket.emit('drop_chat_error', { message: 'Impossible de récupérer l\'historique du chat' });
        }
    }

    /**
     * Envoyer un message dans le chat d'un drop
     */
    async sendDropMessage(socket, messageData) {
        try {
            console.log('💬 [DROP-CHAT] Début sendDropMessage:', {
                socketId: socket.id,
                userId: socket.userId,
                messageData: messageData
            });

            if (!this.socketHandler.isUserAuthenticated(socket)) {
                console.log('❌ [DROP-CHAT] Utilisateur non authentifié');
                socket.emit('drop_chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { dropId, text } = messageData;
            console.log('💬 [DROP-CHAT] Données du message:', { dropId, text });

            // Validation des données
            if (!dropId) {
                socket.emit('drop_chat_error', { message: 'ID de drop manquant' });
                return;
            }

            if (!text || text.trim().length === 0) {
                socket.emit('drop_chat_error', { message: 'Le message ne peut pas être vide' });
                return;
            }

            if (text.length > 1000) {
                socket.emit('drop_chat_error', { message: 'Le message est trop long (maximum 1000 caractères)' });
                return;
            }

            // Vérifier le rate limiting
            if (!this.checkRateLimit(socket.userId)) {
                socket.emit('drop_chat_error', { message: 'Vous envoyez trop de messages. Veuillez patienter.' });
                return;
            }

            // Vérifier que le drop existe
            const drop = await Drop.findByPk(dropId);
            if (!drop) {
                socket.emit('drop_chat_error', { message: 'Ce drop n\'existe pas' });
                return;
            }

            // Créer le message dans la base de données
            console.log('💬 [DROP-CHAT] Création du message en BDD...');
            const newMessage = await DropMessageRepository.create({
                id_message: uuidv4(),
                message: text.trim(),
                id_user: socket.userId,
                id_drop: dropId
            });
            console.log('✅ [DROP-CHAT] Message créé:', newMessage.id_message);

            // Récupérer le message complet avec les informations utilisateur
            console.log('💬 [DROP-CHAT] Récupération du message complet...');
            const completeMessage = await DropMessageRepository.findById(newMessage.id_message);
            console.log('✅ [DROP-CHAT] Message complet récupéré:', completeMessage ? 'OK' : 'ERREUR');

            // Préparer les données du message pour l'envoi
            const messageToSend = {
                id_message: completeMessage.id_message,
                message: completeMessage.message,
                user: {
                    id_user: completeMessage.user?.id_user || socket.userId,
                    pseudo: completeMessage.user?.pseudo || socket.userPseudo || 'Utilisateur',
                    photo: completeMessage.user?.photo || null
                },
                dropId: dropId,
                timestamp: completeMessage.createdAt || completeMessage.timestamp,
                edited_at: completeMessage.edited_at
            };

            console.log('💬 [DROP-CHAT] Message à envoyer:', messageToSend);

            // Diffuser le message à tous les participants du chat du drop
            const roomName = `drop_chat_${dropId}`;
            this.io.to(roomName).emit('new_drop_message', messageToSend);

            console.log(`✅ [DROP-CHAT] Message diffusé dans la salle ${roomName}`);

        } catch (error) {
            console.error('❌ [DROP-CHAT] Erreur lors de l\'envoi du message:', error);
            console.error('❌ [DROP-CHAT] Stack trace:', error.stack);
            socket.emit('drop_chat_error', { 
                message: error.message || 'Impossible d\'envoyer le message',
                error: error.toString(),
                stack: error.stack
            });
        }
    }

    /**
     * Obtenir les statistiques du chat d'un drop
     */
    async getDropChatStats(socket, data) {
        try {
            console.log('📊 [DROP-CHAT] Récupération des statistiques:', data);

            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('drop_chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { dropId } = data;
            if (!dropId) {
                socket.emit('drop_chat_error', { message: 'ID de drop manquant' });
                return;
            }

            const stats = await DropMessageRepository.getDropChatStats(dropId);
            const onlineParticipants = this.dropParticipants.get(dropId)?.size || 0;

            socket.emit('drop_chat_stats', {
                dropId: dropId,
                ...stats,
                onlineParticipants: onlineParticipants
            });

            console.log(`✅ [DROP-CHAT] Statistiques envoyées pour le drop ${dropId}`);

        } catch (error) {
            console.error('❌ [DROP-CHAT] Erreur lors de la récupération des statistiques:', error);
            socket.emit('drop_chat_error', { message: 'Impossible de récupérer les statistiques' });
        }
    }

    /**
     * Nettoyer les participants lors de la déconnexion
     */
    handleDisconnection(socket) {
        if (socket.currentDropChatId) {
            this.leaveDropChat(socket, { dropId: socket.currentDropChatId });
        }
    }
}

module.exports = DropChatSocketController;
