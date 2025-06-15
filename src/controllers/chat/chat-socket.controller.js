const GeneralChatRepository = require('../../models/repositories/chat/general_chat-repository');
const { v4: uuidv4 } = require('uuid');

class ChatSocketController {
    constructor(io, socketHandler) {
        this.io = io;
        this.socketHandler = socketHandler;
        this.chatParticipants = new Map(); // Stocker les participants du chat général
    }

    // Fonction utilitaire pour nettoyer les données avant envoi WebSocket
    cleanMessageData(messageData) {
        if (!messageData) return null;

        return {
            id_message: messageData.id_message,
            message: messageData.message,
            user: {
                id_user: messageData.user?.id_user || null,
                pseudo: messageData.user?.pseudo || 'Utilisateur inconnu',
                photo: messageData.user?.photo || null
            },
            timestamp: messageData.timestamp || messageData.createdAt,
            createdAt: messageData.createdAt,
            edited_at: messageData.edited_at
        };
    }

    // Rejoindre le chat général
    async joinGeneralChat(socket) {
        try {
            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            // Rejoindre la salle du chat général
            socket.join('general_chat');

            // Ajouter l'utilisateur à la liste des participants
            this.chatParticipants.set(socket.id, {
                userId: socket.userId,
                pseudo: socket.userPseudo || socket.userEmail,
                joinedAt: new Date()
            });

            console.log(`${socket.userId} (${socket.userEmail}) a rejoint le chat général`);

            // Confirmer la connexion au chat
            socket.emit('general_chat_joined', {
                message: 'Vous avez rejoint le chat général',
                participantCount: this.chatParticipants.size
            });

            // Notifier les autres participants
            socket.to('general_chat').emit('user_joined_chat', {
                userId: socket.userId,
                pseudo: socket.userPseudo || socket.userEmail,
                participantCount: this.chatParticipants.size
            });

            // Envoyer l'historique récent des messages
            await this.sendChatHistory(socket);

        } catch (error) {
            console.error('Erreur lors de la connexion au chat général:', error);
            socket.emit('chat_error', { message: 'Impossible de rejoindre le chat général' });
        }
    }

    // Quitter le chat général
    async leaveGeneralChat(socket) {
        try {
            socket.leave('general_chat');

            // Retirer l'utilisateur de la liste des participants
            if (this.chatParticipants.has(socket.id)) {
                this.chatParticipants.delete(socket.id);

                console.log(`${socket.userId} a quitté le chat général`);

                // Notifier les autres participants
                socket.to('general_chat').emit('user_left_chat', {
                    userId: socket.userId,
                    participantCount: this.chatParticipants.size
                });

                // Confirmer la déconnexion
                socket.emit('general_chat_left', {
                    message: 'Vous avez quitté le chat général'
                });
            }

        } catch (error) {
            console.error('Erreur lors de la déconnexion du chat général:', error);
        }
    }

    // Récupérer l'historique du chat
    async getChatHistory(socket, data = {}) {
        try {
            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { limit = 50, offset = 0 } = data;
            const chatHistory = await GeneralChatRepository.getChatHistory(limit, offset);

            socket.emit('general_chat_history', {
                messages: chatHistory,
                hasMore: chatHistory.length === limit
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            socket.emit('chat_error', { message: 'Impossible de récupérer l\'historique du chat' });
        }
    }

    // Envoyer l'historique récent (pour les nouveaux utilisateurs)
    async sendChatHistory(socket) {
        try {
            const recentMessages = await GeneralChatRepository.getRecentMessages(20);
            
            socket.emit('general_chat_history', {
                messages: recentMessages,
                isRecent: true
            });

        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'historique récent:', error);
        }
    }

    // Envoyer un message dans le chat général
    async sendGeneralMessage(socket, messageData, userId) {
        try {
            console.log('💬💬 [SOCKET-HANDLER] Réception message:', messageData);
            console.log('💬💬 [SOCKET-HANDLER] Socket info:', {
                socketId: socket.id,
                userId: socket.userId,
                authenticated: socket.authenticated
            });
            console.log("USER IDDDD : " +messageData)
            //if (!this.socketHandler.isUserAuthenticated(socket.authenticated.token)) {
            //    console.log('Utilisateur non authentifié, impossible d\'envoyer le message');
            //    socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
            //    return;
            //}

            // Validation du message
            if (!messageData.text || messageData.text.trim().length === 0) {
                socket.emit('chat_error', { message: 'Le message ne peut pas être vide' });
                return;
            }

            if (messageData.text.length > 1000) {
                socket.emit('chat_error', { message: 'Le message est trop long (maximum 1000 caractères)' });
                return;
            }

            // Vérifier le rate limiting (anti-spam)
            if (!this.checkRateLimit(socket.userId)) {
                console.log('Rate limit atteint, impossible d\'envoyer le message');
                socket.emit('chat_error', { message: 'Vous envoyez des messages trop rapidement. Veuillez patienter.' });
                return;
            }

            // Créer le message dans la base de données
            const newMessage = await GeneralChatRepository.create({
                id_message: uuidv4(),
                message: messageData.text.trim(),
                id_user: socket.userId
            });
            console.log(newMessage);

            // Récupérer le message complet avec les informations utilisateur
            const completeMessage = await GeneralChatRepository.findById(newMessage.id_message);

            // Préparer les données du message pour l'envoi (objet JSON propre)
            const messageToSend = {
                id_message: completeMessage.id_message,
                message: completeMessage.message,
                user: {
                    id_user: completeMessage.user?.id_user || socket.userId,
                    pseudo: completeMessage.user?.pseudo || socket.userPseudo || 'Utilisateur',
                    photo: completeMessage.user?.photo || null
                },
                timestamp: completeMessage.createdAt || completeMessage.timestamp,
                edited_at: completeMessage.edited_at
            };

            console.log(` Message envoyé par ${socket.userId}: ${messageData.text.substring(0, 50)}...`);

            console.log(messageToSend);
            // Diffuser le message à tous les clients dans le chat général
            this.io.to('general_chat').emit('new_general_message', messageToSend);

        } catch (error) {
            console.error('❌ [CHAT-CONTROLLER] Erreur lors de l\'envoi du message:', error);
            console.error('❌ [CHAT-CONTROLLER] Stack trace:', error.stack);
            socket.emit('chat_error', {
                message: error.message || 'Impossible d\'envoyer le message',
                error: error.toString(),
                stack: error.stack
            });
        }
    }

    // Modifier un message
    async editMessage(socket, data) {
        try {
            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { messageId, newText } = data;

            if (!messageId || !newText || newText.trim().length === 0) {
                socket.emit('chat_error', { message: 'Données de modification invalides' });
                return;
            }

            if (newText.length > 1000) {
                socket.emit('chat_error', { message: 'Le message modifié est trop long (maximum 1000 caractères)' });
                return;
            }

            // Modifier le message
            const updatedMessage = await GeneralChatRepository.updateMessage(
                messageId,
                socket.userId,
                newText.trim()
            );

            // Préparer les données du message modifié
            const messageToSend = {
                id_message: updatedMessage.id_message,
                message: updatedMessage.message,
                user: {
                    id_user: updatedMessage.user.id_user,
                    pseudo: updatedMessage.user.pseudo,
                    photo: updatedMessage.user.photo
                },
                timestamp: updatedMessage.createdAt,
                edited_at: updatedMessage.edited_at
            };

            // Diffuser la modification à tous les clients
            this.io.to('general_chat').emit('message_edited', messageToSend);

            console.log(`Message ${messageId} modifié par ${socket.userId}`);

        } catch (error) {
            console.error('Erreur lors de la modification du message:', error);
            socket.emit('chat_error', { message: error.message || 'Impossible de modifier le message' });
        }
    }

    // Supprimer un message
    async deleteMessage(socket, data) {
        try {
            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { messageId } = data;

            if (!messageId) {
                socket.emit('chat_error', { message: 'ID du message manquant' });
                return;
            }

            // Supprimer le message
            await GeneralChatRepository.deleteMessage(messageId, socket.userId);

            // Notifier tous les clients de la suppression
            this.io.to('general_chat').emit('message_deleted', { messageId });

            console.log(`Message ${messageId} supprimé par ${socket.userId}`);

        } catch (error) {
            console.error('Erreur lors de la suppression du message:', error);
            socket.emit('chat_error', { message: error.message || 'Impossible de supprimer le message' });
        }
    }

    // Rechercher des messages
    async searchMessages(socket, data) {
        try {
            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const { query, limit = 20 } = data;

            if (!query || query.trim().length < 2) {
                socket.emit('chat_error', { message: 'La recherche doit contenir au moins 2 caractères' });
                return;
            }

            const searchResults = await GeneralChatRepository.searchMessages(query.trim(), limit);

            socket.emit('search_results', {
                query: query.trim(),
                results: searchResults
            });

        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            socket.emit('chat_error', { message: 'Erreur lors de la recherche' });
        }
    }

    // Obtenir les statistiques du chat
    async getChatStats(socket) {
        try {
            if (!this.socketHandler.isUserAuthenticated(socket)) {
                socket.emit('chat_error', { message: 'Utilisateur non authentifié' });
                return;
            }

            const stats = await GeneralChatRepository.getChatStats();
            stats.onlineParticipants = this.chatParticipants.size;

            socket.emit('chat_stats', stats);

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            socket.emit('chat_error', { message: 'Impossible de récupérer les statistiques' });
        }
    }

    // Vérification du rate limiting (anti-spam)
    checkRateLimit(userId) {
        const now = Date.now();
        const userKey = `rate_limit_${userId}`;
        
        if (!this.rateLimitMap) {
            this.rateLimitMap = new Map();
        }

        const userRateLimit = this.rateLimitMap.get(userKey) || { count: 0, resetTime: now + 60000 }; // 1 minute

        // Reset si le temps est écoulé
        if (now > userRateLimit.resetTime) {
            userRateLimit.count = 0;
            userRateLimit.resetTime = now + 60000;
        }

        // Vérifier la limite (ex: 10 messages par minute)
        if (userRateLimit.count >= 10) {
            return false;
        }

        userRateLimit.count++;
        this.rateLimitMap.set(userKey, userRateLimit);
        return true;
    }

    // Nettoyer les participants déconnectés
    cleanupDisconnectedUsers() {
        // Cette méthode sera appelée lors des déconnexions
        console.log(`Nettoyage des participants du chat. Participants actuels: ${this.chatParticipants.size}`);
    }

    // Obtenir le nombre de participants
    getParticipantCount() {
        return this.chatParticipants.size;
    }
}

module.exports = ChatSocketController;
