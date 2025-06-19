const AuctionRepository = require('../../models/repositories/auction/auction-repository');
const HistoryAuctionRepository = require('../../models/repositories/auction/history_auction-repository');
const { Auction } = require('../../models/models/auction/auction.model');
const { HistoryAuction } = require('../../models/models/auction/history_auction.model');
const { User } = require('../../models/models/user/user.model');
const { v4: uuidv4 } = require('uuid');
const AuctionRealtimeService = require('../../services/auction-realtime.service');

class AuctionSocketController {
    constructor(io, socketHandler) {
        this.io = io;
        this.socketHandler = socketHandler;
        this.auctionService = new AuctionRealtimeService(io);
    }

    /**
     * Récupérer les données complètes d'une enchère avec toutes les relations
     */
    async getCompleteAuctionData(auctionId) {
        try {
            const { Product } = require('../../models/models/product/product.model');
            const { Category } = require('../../models/models/product/category.model');
            const { Brand } = require('../../models/models/product/brand.model');
            const { ProductImage } = require('../../models/models/product/product_image.model');
            const { Image } = require('../../models/models/product/image.model');

            const auction = await Auction.findByPk(auctionId, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id_user', 'pseudo', 'photo']
                    },
                    {
                        model: Product,
                        attributes: ['id_product', 'name', 'description'],
                        include: [
                            {
                                model: Category,
                                attributes: ['id_category', 'name']
                            },
                            {
                                model: Brand,
                                attributes: ['id_brand', 'name']
                            },
                            {
                                model: ProductImage,
                                attributes: ['id_product_image'],
                                include: [
                                    {
                                        model: Image,
                                        attributes: ['id_image', 'image']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            if (!auction) {
                return null;
            }

            // Récupérer le dernier enchérisseur
            const lastBid = await this.auctionService.getLastBid(auctionId);

            // Calculer le temps restant
            const timeRemaining = this.auctionService.calculateTimeRemaining(auction.end_date);

            // Préparer l'objet auction complet
            const auctionData = {
                id_auction: auction.id_auction,
                initial_price: auction.initial_price,
                actual_price: auction.actual_price,
                start_date: auction.start_date,
                end_date: auction.end_date,
                timeRemaining: timeRemaining,
                status: this.auctionService.getAuctionStatus(auction),
                isActive: this.auctionService.isAuctionActive(auction),
                last_bidder: lastBid ? {
                    id_user: lastBid.user.id_user,
                    pseudo: lastBid.user.pseudo,
                    photo: lastBid.user.photo
                } : null,
                last_bid_time: lastBid ? lastBid.timestamp : null,
                owner: {
                    id_user: auction.owner.id_user,
                    pseudo: auction.owner.pseudo,
                    photo: auction.owner.photo
                },
                Product: {
                    id_product: auction.Product.id_product,
                    name: auction.Product.name,
                    description: auction.Product.description,
                    price: auction.actual_price,
                    Category: auction.Product.Category ? {
                        id_category: auction.Product.Category.id_category,
                        name: auction.Product.Category.name
                    } : null,
                    Brand: auction.Product.Brand ? {
                        id_brand: auction.Product.Brand.id_brand,
                        name: auction.Product.Brand.name
                    } : null,
                    ProductImages: auction.Product.ProductImages ?
                        auction.Product.ProductImages.map(pi => ({
                            id_product_image: pi.id_product_image,
                            Image: {
                                id_image: pi.Image.id_image,
                                image: pi.Image.image
                            }
                        })) : []
                }
            };

            return auctionData;
        } catch (error) {
            console.error('❌ [AUCTION-CONTROLLER] Erreur lors de la récupération des données complètes:', error);
            throw error;
        }
    }

    /**
     * Rejoindre une salle d'enchère
     */
    async joinAuctionRoom(socket, data) {
        const { auctionId } = data;

        console.log(`🏠 [AUCTION-CONTROLLER] Tentative de rejoindre la salle d'enchère: ${auctionId}`);

        if (!this.socketHandler.isUserAuthenticated(socket)) {
            socket.emit('auction_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!auctionId) {
            socket.emit('auction_error', { message: 'ID d\'enchère requis' });
            return;
        }

        try {
            // Vérifier que l'enchère existe
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                socket.emit('auction_error', { message: 'Enchère non trouvée' });
                return;
            }

            const roomName = `auction_${auctionId}`;
            socket.join(roomName);

            console.log(`✅ [AUCTION-CONTROLLER] ${socket.userPseudo} a rejoint la salle: ${roomName}`);

            // Confirmer l'entrée dans la salle
            socket.emit('auction_room_joined', {
                auctionId: auctionId,
                roomName: roomName,
                message: 'Vous avez rejoint la salle d\'enchère',
                timestamp: new Date().toISOString()
            });

            // Envoyer immédiatement les données actuelles de l'enchère
            const auctionData = await this.getCompleteAuctionData(auctionId);
            if (auctionData) {
                socket.emit('auction_updated', auctionData);
            }

            // Notifier les autres participants
            const participantCount = this.io.sockets.adapter.rooms.get(roomName)?.size || 0;
            socket.to(roomName).emit('user_joined_auction', {
                userId: socket.userId,
                pseudo: socket.userPseudo,
                participantCount: participantCount
            });

        } catch (error) {
            console.error('❌ [AUCTION-CONTROLLER] Erreur lors de la connexion à la salle d\'enchère:', error);
            socket.emit('auction_error', { message: 'Impossible de rejoindre la salle d\'enchère' });
        }
    }

    /**
     * S'abonner aux mises à jour d'une enchère
     */
    async subscribeToAuctionUpdates(socket, data) {
        const { auctionId } = data;

        console.log(`📡 [AUCTION-CONTROLLER] Abonnement aux mises à jour: ${auctionId}`);

        if (!this.socketHandler.isUserAuthenticated(socket)) {
            socket.emit('auction_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!auctionId) {
            socket.emit('auction_error', { message: 'ID d\'enchère requis' });
            return;
        }

        try {
            const roomName = `auction_${auctionId}`;
            socket.join(roomName);

            console.log(`✅ [AUCTION-CONTROLLER] ${socket.userPseudo} s'est abonné aux mises à jour de l'enchère: ${auctionId}`);

            // Envoyer immédiatement les données actuelles de l'enchère
            const auctionData = await this.getCompleteAuctionData(auctionId);
            if (auctionData) {
                socket.emit('auction_updated', auctionData);
            }

        } catch (error) {
            console.error('❌ [AUCTION-CONTROLLER] Erreur lors de l\'abonnement aux mises à jour:', error);
            socket.emit('auction_error', { message: 'Impossible de s\'abonner aux mises à jour' });
        }
    }

    async joinAuction(socket, data) {
        const { auctionId } = data;

        if (!this.socketHandler.isUserAuthenticated(socket)) {
            socket.emit('auction_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!auctionId) {
            socket.emit('auction_error', { message: 'ID d\'enchère manquant' });
            return;
        }

        try {
            // Vérifier que l'enchère existe et est active
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                socket.emit('auction_error', { message: 'Enchère non trouvée' });
                return;
            }

            // Vérifier que l'enchère est encore active
            const now = new Date();
            if (now > auction.end_date) {
                socket.emit('auction_error', { message: 'Cette enchère est terminée' });
                return;
            }

            if (now < auction.start_date) {
                socket.emit('auction_error', { message: 'Cette enchère n\'a pas encore commencé' });
                return;
            }

            // Rejoindre la salle de l'enchère
            const roomName = `auction_${auctionId}`;
            socket.join(roomName);

            // Ajouter l'utilisateur à la salle d'enchère
            const auctionRoom = this.socketHandler.getOrCreateAuctionRoom(auctionId);
            auctionRoom.participants.set(socket.id, {
                userId: socket.userId,
                email: socket.userEmail,
                joinedAt: new Date()
            });
            auctionRoom.lastActivity = new Date();

            console.log(`Utilisateur ${socket.userId} a rejoint l'enchère ${auctionId}`);

            // Récupérer les détails de l'enchère avec l'historique
            const auctionDetails = await this.getAuctionDetails(auctionId);

            // Confirmer la connexion à l'enchère
            socket.emit('auction_joined', {
                auctionId: auctionId,
                auction: auctionDetails,
                participantCount: auctionRoom.participants.size,
                message: 'Vous avez rejoint l\'enchère avec succès'
            });

            // Notifier les autres participants
            socket.to(roomName).emit('user_joined_auction', {
                userId: socket.userId,
                email: socket.userEmail,
                participantCount: auctionRoom.participants.size
            });

            // Envoyer le temps restant
            this.sendTimeRemaining(socket, auction);

        } catch (error) {
            console.error('Erreur lors de la connexion à l\'enchère:', error);
            socket.emit('auction_error', { message: 'Erreur interne du serveur' });
        }
    }

    async leaveAuction(socket, data) {
        const { auctionId } = data;

        if (!auctionId) {
            return;
        }

        try {
            const roomName = `auction_${auctionId}`;
            socket.leave(roomName);

            // Retirer l'utilisateur de la salle d'enchère
            const auctionRoom = this.socketHandler.auctionRooms.get(auctionId);
            if (auctionRoom && auctionRoom.participants.has(socket.id)) {
                auctionRoom.participants.delete(socket.id);

                console.log(`Utilisateur ${socket.userId} a quitté l'enchère ${auctionId}`);

                // Notifier les autres participants
                socket.to(roomName).emit('user_left_auction', {
                    userId: socket.userId,
                    participantCount: auctionRoom.participants.size
                });

                // Confirmer la déconnexion
                socket.emit('auction_left', {
                    auctionId: auctionId,
                    message: 'Vous avez quitté l\'enchère'
                });
            }

        } catch (error) {
            console.error('Erreur lors de la déconnexion de l\'enchère:', error);
        }
    }

    async placeBid(socket, data) {
        const { auctionId, amount } = data;
        console.log(`💰 [AUCTION-CONTROLLER] Réception enchère: ${amount}€ par ${socket.userId} sur ${auctionId}`);

        if (!this.socketHandler.isUserAuthenticated(socket)) {
            socket.emit('bid_error', { message: 'Vous devez être connecté pour enchérir' });
            return;
        }

        if (!auctionId || !amount) {
            socket.emit('bid_error', { message: 'ID d\'enchère et montant sont requis' });
            return;
        }

        // Utiliser une transaction pour éviter les conditions de concurrence
        const { sequelize } = require('../../models/mysql.db');
        const transaction = await sequelize.transaction();

        try {
            // S'assurer que l'utilisateur est dans la salle d'enchère
            const roomName = `auction_${auctionId}`;
            if (!socket.rooms.has(roomName)) {
                console.log(`🏠 [AUCTION-CONTROLLER] Ajout forcé de ${socket.userId} à la salle ${roomName}`);
                socket.join(roomName);
            }

            // Récupérer l'enchère avec le propriétaire
            const auction = await Auction.findByPk(auctionId, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id_user', 'pseudo']
                    }
                ],
                transaction
            });

            if (!auction) {
                await transaction.rollback();
                socket.emit('bid_error', { message: 'Enchère non trouvée' });
                return;
            }

            // Vérifier si l'enchère est terminée
            if (new Date(auction.end_date) <= new Date()) {
                await transaction.rollback();
                socket.emit('bid_error', { message: 'Cette enchère est terminée' });
                return;
            }

            // Vérifier si l'enchère a commencé
            if (new Date(auction.start_date) > new Date()) {
                await transaction.rollback();
                socket.emit('bid_error', { message: 'Cette enchère n\'a pas encore commencé' });
                return;
            }

            // Vérifier si l'utilisateur est le propriétaire de l'enchère
            if (auction.id_user === socket.userId) {
                await transaction.rollback();
                socket.emit('bid_error', { message: 'Vous ne pouvez pas enchérir sur votre propre enchère' });
                return;
            }

            // Récupérer le dernier enchérisseur
            const lastBid = await this.auctionService.getLastBid(auctionId);

            // Vérifier si l'utilisateur est déjà le dernier enchérisseur
            if (lastBid && lastBid.user.id_user === socket.userId) {
                await transaction.rollback();
                socket.emit('bid_error', { message: 'Vous êtes déjà le dernier enchérisseur' });
                return;
            }

            // Vérifier si le montant est valide
            const currentPrice = auction.actual_price || auction.initial_price;
            if (amount <= currentPrice) {
                await transaction.rollback();
                socket.emit('bid_error', {
                    message: `L'enchère doit être supérieure au prix actuel (${currentPrice}€)`,
                    currentPrice: currentPrice
                });
                return;
            }

            // Utiliser le service d'enchères temps réel pour placer l'enchère
            const bidData = await this.auctionService.placeBid(auctionId, socket.userId, amount);

            console.log(bidData)
            await transaction.commit();

            // Récupérer les données complètes de l'enchère après le placement
            const updatedAuction = await this.getCompleteAuctionData(auctionId);

            if (!updatedAuction) {
                throw new Error('Impossible de récupérer les données de l\'enchère après placement');
            }

            // 1. Confirmer l'enchère à l'utilisateur qui l'a placée
            socket.emit('bid_success', {
                message: 'Enchère placée avec succès',
                amount: amount,
                auction: updatedAuction,
                bidData: bidData
            });

            // 2. IMPORTANT: Diffuser la mise à jour à TOUS les clients dans la salle
            // roomName est déjà défini plus haut dans la fonction

            // Vérifier qui est dans la salle avant de diffuser
            const room = this.io.sockets.adapter.rooms.get(roomName);
            const participantCount = room?.size || 0;

            console.log(`📡 [AUCTION-CONTROLLER] Participants dans la salle ${roomName}:`, participantCount);
            if (room) {
                console.log(`📡 [AUCTION-CONTROLLER] IDs des sockets dans la salle:`, Array.from(room));
            }

            // Diffuser la mise à jour
            this.io.to(roomName).emit('auction_updated', updatedAuction);

            // Aussi diffuser avec l'événement new_bid pour compatibilité
            this.io.to(roomName).emit('new_bid', {
                id_bid: bidData.id_bid,
                amount: amount,
                user: updatedAuction.last_bidder,
                auctionId: auctionId,
                timestamp: new Date()
            });

            console.log(`✅ [AUCTION-CONTROLLER] Enchère confirmée: ${amount}€ par ${socket.userPseudo}`);
            console.log(`📡 [AUCTION-CONTROLLER] Mise à jour diffusée à la salle ${roomName} (${participantCount} participants)`);

            // Mettre à jour l'activité de la salle
            const auctionRoom = this.socketHandler.auctionRooms.get(auctionId);
            if (auctionRoom) {
                auctionRoom.lastActivity = new Date();
            }

        } catch (error) {
            // Vérifier si la transaction n'a pas déjà été commitée avant de faire un rollback
            if (!transaction.finished) {
                await transaction.rollback();
            }

            console.error('❌ [AUCTION-CONTROLLER] Erreur lors du placement de l\'enchère:', error);

            // Gestion spécifique des erreurs du service
            if (error.message.includes('Enchère dépassée')) {
                socket.emit('bid_outbid', {
                    message: error.message,
                    currentPrice: error.currentPrice || 0
                });
            } else {
                socket.emit('bid_error', {
                    message: error.message || 'Une erreur est survenue lors du placement de votre enchère',
                    error: error.toString()
                });
            }
        }
    }

    async getActiveAuctions(socket) {
        try {
            const activeAuctions = await AuctionRepository.findActiveAuctions();
            
            // Ajouter le nombre de participants pour chaque enchère
            const auctionsWithParticipants = activeAuctions.map(auction => {
                const participantCount = this.socketHandler.getAuctionParticipants(auction.id_auction);
                return {
                    ...auction.toJSON(),
                    participantCount: participantCount
                };
            });

            socket.emit('active_auctions', {
                auctions: auctionsWithParticipants,
                count: auctionsWithParticipants.length
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des enchères actives:', error);
            socket.emit('auctions_error', { message: 'Erreur lors de la récupération des enchères' });
        }
    }

    async getAuctionDetails(auctionId) {
        try {
            // Utiliser le service d'enchères temps réel pour obtenir les détails complets
            const auctionDetails = await this.auctionService.getAuctionDetails(auctionId);

            if (!auctionDetails) {
                return null;
            }

            // Ajouter le nombre de participants connectés
            const connectedParticipants = this.socketHandler.getAuctionParticipants(auctionId);

            return {
                ...auctionDetails,
                connectedParticipants: connectedParticipants
            };

        } catch (error) {
            console.error('Erreur lors de la récupération des détails de l\'enchère:', error);
            return null;
        }
    }

    sendTimeRemaining(socket, auction) {
        const now = new Date();
        const endTime = new Date(auction.end_date);
        const timeRemaining = Math.max(0, endTime.getTime() - now.getTime());

        socket.emit('time_remaining', {
            auctionId: auction.id_auction,
            timeRemaining: timeRemaining,
            endDate: auction.end_date,
            isActive: timeRemaining > 0
        });
    }

    // Méthode pour gérer la fin automatique des enchères
    async handleAuctionEnd(auctionId) {
        try {
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                return;
            }

            console.log(`Enchère ${auctionId} terminée`);

            // Notifier tous les participants
            this.socketHandler.broadcastToAuction(auctionId, 'auction_ended', {
                auctionId: auctionId,
                finalPrice: auction.actual_price || auction.initial_price,
                endTime: auction.end_date
            });

            // Nettoyer la salle d'enchère
            this.socketHandler.auctionRooms.delete(auctionId);

        } catch (error) {
            console.error('Erreur lors de la gestion de fin d\'enchère:', error);
        }
    }

    /**
     * Récupérer l'historique des enchères
     */
    async getBidHistory(socket, data) {
        const { auctionId, limit = 20, offset = 0 } = data;

        console.log(`📜 [AUCTION-CONTROLLER] Récupération historique enchères: ${auctionId}`);

        if (!this.socketHandler.isUserAuthenticated(socket)) {
            socket.emit('auction_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!auctionId) {
            socket.emit('auction_error', { message: 'ID d\'enchère manquant' });
            return;
        }

        try {
            const bidHistory = await this.auctionService.getBidHistory(auctionId, limit, offset);

            socket.emit('bid_history', {
                auctionId: auctionId,
                bids: bidHistory,
                hasMore: bidHistory.length === limit
            });

            console.log(`✅ [AUCTION-CONTROLLER] Historique envoyé: ${bidHistory.length} enchères`);

        } catch (error) {
            console.error('❌ [AUCTION-CONTROLLER] Erreur lors de la récupération de l\'historique:', error);
            socket.emit('auction_error', { message: 'Impossible de récupérer l\'historique des enchères' });
        }
    }

    /**
     * Nettoyer lors de la déconnexion
     */
    handleDisconnection(socket) {
        // Nettoyer les salles d'enchères lors de la déconnexion
        for (const [auctionId, room] of this.socketHandler.auctionRooms.entries()) {
            if (room.participants.has(socket.id)) {
                room.participants.delete(socket.id);

                // Notifier les autres participants
                socket.to(`auction_${auctionId}`).emit('user_left_auction', {
                    userId: socket.userId,
                    participantCount: room.participants.size
                });

                // Supprimer la salle si elle est vide
                if (room.participants.size === 0) {
                    this.socketHandler.auctionRooms.delete(auctionId);
                }
            }
        }
    }
}

module.exports = AuctionSocketController;
