const AuctionRepository = require('../../models/repositories/auction/auction-repository');
const HistoryAuctionRepository = require('../../models/repositories/auction/history_auction-repository');
const { Auction } = require('../../models/models/auction/auction.model');
const { HistoryAuction } = require('../../models/models/auction/history_auction.model');
const { v4: uuidv4 } = require('uuid');

class AuctionSocketController {
    constructor(io, socketHandler) {
        this.io = io;
        this.socketHandler = socketHandler;
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
        const { auctionId, bidAmount } = data;

        if (!this.socketHandler.isUserAuthenticated(socket)) {
            socket.emit('bid_error', { message: 'Utilisateur non authentifié' });
            return;
        }

        if (!auctionId || !bidAmount) {
            socket.emit('bid_error', { message: 'Données d\'enchère manquantes' });
            return;
        }

        try {
            // Récupérer l'enchère
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                socket.emit('bid_error', { message: 'Enchère non trouvée' });
                return;
            }

            // Vérifier que l'enchère est active
            const now = new Date();
            if (now > auction.end_date) {
                socket.emit('bid_error', { message: 'Cette enchère est terminée' });
                return;
            }

            if (now < auction.start_date) {
                socket.emit('bid_error', { message: 'Cette enchère n\'a pas encore commencé' });
                return;
            }

            // Vérifier que l'utilisateur n'est pas le propriétaire de l'enchère
            if (auction.id_user === socket.userId) {
                socket.emit('bid_error', { message: 'Vous ne pouvez pas enchérir sur votre propre produit' });
                return;
            }

            // Vérifier que le montant est supérieur au prix actuel
            const currentPrice = auction.actual_price || auction.initial_price;
            if (bidAmount <= currentPrice) {
                socket.emit('bid_error', { 
                    message: `Le montant doit être supérieur à ${currentPrice}€`,
                    currentPrice: currentPrice
                });
                return;
            }

            // Créer l'entrée dans l'historique des enchères
            const historyAuction = await HistoryAuction.create({
                amount: bidAmount,
                createdAt: new Date(),
                id_user: socket.userId,
                id_auction: auctionId
            });

            // Mettre à jour le prix actuel de l'enchère
            await auction.update({
                actual_price: bidAmount
            });

            console.log(`Nouvelle enchère: ${bidAmount}€ par ${socket.userId} sur l'enchère ${auctionId}`);

            // Préparer les données de l'enchère
            const bidData = {
                auctionId: auctionId,
                bidAmount: bidAmount,
                userId: socket.userId,
                userEmail: socket.userEmail,
                timestamp: new Date(),
                currentPrice: bidAmount,
                previousPrice: currentPrice
            };

            // Confirmer l'enchère à l'utilisateur
            socket.emit('bid_placed', {
                ...bidData,
                message: 'Votre enchère a été placée avec succès'
            });

            // Notifier tous les participants de la salle
            const roomName = `auction_${auctionId}`;
            socket.to(roomName).emit('new_bid', bidData);

            // Mettre à jour l'activité de la salle
            const auctionRoom = this.socketHandler.auctionRooms.get(auctionId);
            if (auctionRoom) {
                auctionRoom.lastActivity = new Date();
            }

        } catch (error) {
            console.error('Erreur lors du placement de l\'enchère:', error);
            socket.emit('bid_error', { message: 'Erreur interne du serveur' });
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
            // Récupérer l'enchère avec les détails du produit
            const auction = await AuctionRepository.findById(auctionId);
            if (!auction) {
                return null;
            }

            // Récupérer l'historique des enchères
            const bidHistory = await HistoryAuctionRepository.findByAuctionId(auctionId);

            return {
                ...auction.toJSON(),
                bidHistory: bidHistory,
                participantCount: this.socketHandler.getAuctionParticipants(auctionId)
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
}

module.exports = AuctionSocketController;
