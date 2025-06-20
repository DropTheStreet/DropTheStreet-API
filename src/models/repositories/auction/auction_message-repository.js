const { AuctionMessage } = require('../../models/auction/auction_message.model');
const { User } = require('../../models/user/user.model');
const { Auction } = require('../../models/auction/auction.model');
const { Op } = require('sequelize');

/**
 * Repository pour la gestion des messages d'enchères
 */
class AuctionMessageRepository {
    
    /**
     * Créer un nouveau message d'enchère
     */
    static async create(messageData) {
        try {
            const message = await AuctionMessage.create(messageData);
            return message;
        } catch (error) {
            console.error('Erreur lors de la création du message d\'enchère:', error);
            throw error;
        }
    }

    /**
     * Récupérer l'historique des messages d'une enchère
     */
    static async getAuctionChatHistory(auctionId, limit = 50, offset = 0) {
        try {
            const messages = await AuctionMessage.findAll({
                where: {
                    id_auction: auctionId,
                    is_deleted: false
                },
                include: [
                    {
                        model: User,
                        attributes: ['id_user', 'pseudo', 'photo'],
                        as: 'user'
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset
            });

            // Convertir en objets JSON propres et inverser l'ordre
            const cleanMessages = messages.map(message => {
                const messageJson = message.toJSON();
                return {
                    id_message: messageJson.id_message,
                    message: messageJson.message,
                    user: {
                        id_user: messageJson.user?.id_user || null,
                        pseudo: messageJson.user?.pseudo || 'Utilisateur inconnu',
                        photo: messageJson.user?.photo || null
                    },
                    timestamp: messageJson.createdAt,
                    createdAt: messageJson.createdAt,
                    edited_at: messageJson.edited_at
                };
            });

            return cleanMessages.reverse(); // Plus anciens en premier
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique du chat d\'enchère:', error);
            throw error;
        }
    }

    /**
     * Récupérer les messages récents d'une enchère
     */
    static async getRecentMessages(auctionId, limit = 20) {
        try {
            const messages = await AuctionMessage.findAll({
                where: {
                    id_auction: auctionId,
                    is_deleted: false,
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
                    }
                },
                include: [
                    {
                        model: User,
                        attributes: ['id_user', 'pseudo', 'photo'],
                        as: 'user'
                    }
                ],
                order: [['createdAt', 'ASC']],
                limit: limit
            });

            // Convertir en objets JSON propres
            const cleanMessages = messages.map(message => {
                const messageJson = message.toJSON();
                return {
                    id_message: messageJson.id_message,
                    message: messageJson.message,
                    user: {
                        id_user: messageJson.user?.id_user || null,
                        pseudo: messageJson.user?.pseudo || 'Utilisateur inconnu',
                        photo: messageJson.user?.photo || null
                    },
                    timestamp: messageJson.createdAt,
                    createdAt: messageJson.createdAt,
                    edited_at: messageJson.edited_at
                };
            });

            return cleanMessages;
        } catch (error) {
            console.error('Erreur lors de la récupération des messages récents:', error);
            throw error;
        }
    }

    /**
     * Récupérer un message par ID
     */
    static async findById(messageId) {
        try {
            const message = await AuctionMessage.findByPk(messageId, {
                include: [
                    {
                        model: User,
                        attributes: ['id_user', 'pseudo', 'photo'],
                        as: 'user'
                    }
                ]
            });

            if (!message) {
                return null;
            }

            // Convertir en objet JSON propre
            const messageJson = message.toJSON();
            return {
                id_message: messageJson.id_message,
                message: messageJson.message,
                user: {
                    id_user: messageJson.user?.id_user || null,
                    pseudo: messageJson.user?.pseudo || 'Utilisateur inconnu',
                    photo: messageJson.user?.photo || null
                },
                timestamp: messageJson.createdAt,
                createdAt: messageJson.createdAt,
                edited_at: messageJson.edited_at
            };
        } catch (error) {
            console.error('Erreur lors de la récupération du message:', error);
            throw error;
        }
    }

    /**
     * Modifier un message
     */
    static async updateMessage(messageId, newText, userId) {
        try {
            const message = await AuctionMessage.findOne({
                where: {
                    id_message: messageId,
                    id_user: userId,
                    is_deleted: false
                }
            });

            if (!message) {
                throw new Error('Message non trouvé ou non autorisé');
            }

            // Vérifier que le message n'est pas trop ancien (5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (message.createdAt < fiveMinutesAgo) {
                throw new Error('Impossible de modifier un message de plus de 5 minutes');
            }

            await message.update({
                message: newText,
                edited_at: new Date()
            });

            return await this.findById(messageId);
        } catch (error) {
            console.error('Erreur lors de la modification du message:', error);
            throw error;
        }
    }

    /**
     * Supprimer un message (soft delete)
     */
    static async deleteMessage(messageId, userId) {
        try {
            const message = await AuctionMessage.findOne({
                where: {
                    id_message: messageId,
                    id_user: userId,
                    is_deleted: false
                }
            });

            if (!message) {
                throw new Error('Message non trouvé ou non autorisé');
            }

            await message.update({
                is_deleted: true
            });

            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du message:', error);
            throw error;
        }
    }

    /**
     * Compter les messages d'une enchère
     */
    static async countMessages(auctionId) {
        try {
            return await AuctionMessage.count({
                where: {
                    id_auction: auctionId,
                    is_deleted: false
                }
            });
        } catch (error) {
            console.error('Erreur lors du comptage des messages:', error);
            throw error;
        }
    }

    /**
     * Rechercher des messages dans une enchère
     */
    static async searchMessages(auctionId, query, limit = 20) {
        try {
            const messages = await AuctionMessage.findAll({
                where: {
                    id_auction: auctionId,
                    is_deleted: false,
                    message: {
                        [Op.like]: `%${query}%`
                    }
                },
                include: [
                    {
                        model: User,
                        attributes: ['id_user', 'pseudo', 'photo'],
                        as: 'user'
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: limit
            });

            // Convertir en objets JSON propres
            const cleanMessages = messages.map(message => {
                const messageJson = message.toJSON();
                return {
                    id_message: messageJson.id_message,
                    message: messageJson.message,
                    user: {
                        id_user: messageJson.user?.id_user || null,
                        pseudo: messageJson.user?.pseudo || 'Utilisateur inconnu',
                        photo: messageJson.user?.photo || null
                    },
                    timestamp: messageJson.createdAt,
                    createdAt: messageJson.createdAt,
                    edited_at: messageJson.edited_at
                };
            });

            return cleanMessages;
        } catch (error) {
            console.error('Erreur lors de la recherche de messages:', error);
            throw error;
        }
    }
}

module.exports = AuctionMessageRepository;
