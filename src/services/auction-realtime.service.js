const { Auction } = require('../models/models/auction/auction.model');
const { HistoryAuction } = require('../models/models/auction/history_auction.model');
const { User } = require('../models/models/user/user.model');
const { Product } = require('../models/models/product/product.model');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/**
 * Service pour la gestion des enchères en temps réel
 */
class AuctionRealtimeService {
    constructor(io = null) {
        this.io = io;
        this.activeAuctions = new Map(); // Cache des enchères actives
        this.auctionTimers = new Map(); // Timers pour la fin automatique
        this.bidQueue = new Map(); // Queue pour éviter les conflits de bids
    }

    /**
     * Définir l'instance Socket.IO
     */
    setSocketIO(io) {
        this.io = io;
    }

    /**
     * Récupérer une enchère avec toutes ses informations
     */
    async getAuctionDetails(auctionId) {
        try {
            const auction = await Auction.findByPk(auctionId, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id_user', 'pseudo', 'photo']
                    },
                    {
                        model: Product,
                        attributes: ['id_product', 'name', 'description']
                    }
                ]
            });

            if (!auction) {
                throw new Error('Enchère non trouvée');
            }

            // Récupérer le dernier bid
            const lastBid = await this.getLastBid(auctionId);
            
            // Récupérer le nombre de participants
            const participantCount = await this.getParticipantCount(auctionId);

            // Calculer le temps restant
            const timeRemaining = this.calculateTimeRemaining(auction.end_date);

            return {
                id_auction: auction.id_auction,
                initial_price: auction.initial_price,
                actual_price: auction.actual_price || auction.initial_price,
                start_date: auction.start_date,
                end_date: auction.end_date,
                product: auction.Product,
                owner: auction.owner,
                lastBid: lastBid,
                participantCount: participantCount,
                timeRemaining: timeRemaining,
                status: this.getAuctionStatus(auction),
                isActive: this.isAuctionActive(auction)
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des détails de l\'enchère:', error);
            throw error;
        }
    }

    /**
     * Placer une enchère
     */
    async placeBid(auctionId, userId, amount) {
        try {
            console.log(`💰 [AUCTION-SERVICE] Tentative d'enchère: ${amount}€ par ${userId} sur ${auctionId}`);

            // Vérifier que l'enchère existe et est active
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                throw new Error('Enchère non trouvée');
            }

            if (!this.isAuctionActive(auction)) {
                throw new Error('Cette enchère n\'est plus active');
            }

            // Vérifier que l'utilisateur n'est pas le propriétaire
            if (auction.id_user === userId) {
                throw new Error('Vous ne pouvez pas enchérir sur votre propre enchère');
            }

            // Vérifier que le montant est valide
            const currentPrice = auction.actual_price || auction.initial_price;
            const minimumBid = currentPrice + 1; // Minimum 1€ de plus

            if (amount < minimumBid) {
                throw new Error(`Le montant minimum est de ${minimumBid}€`);
            }

            // Utiliser une queue pour éviter les conflits
            const bidId = uuidv4();
            if (!this.bidQueue.has(auctionId)) {
                this.bidQueue.set(auctionId, []);
            }

            return new Promise((resolve, reject) => {
                this.bidQueue.get(auctionId).push({
                    bidId,
                    userId,
                    amount,
                    resolve,
                    reject,
                    timestamp: Date.now()
                });

                this.processBidQueue(auctionId);
            });

        } catch (error) {
            console.error('❌ [AUCTION-SERVICE] Erreur lors du placement de l\'enchère:', error);
            throw error;
        }
    }

    /**
     * Traiter la queue des enchères pour éviter les conflits
     */
    async processBidQueue(auctionId) {
        const queue = this.bidQueue.get(auctionId);
        if (!queue || queue.length === 0) return;

        const bid = queue.shift();
        
        try {
            // Re-vérifier l'enchère au moment du traitement
            const auction = await Auction.findByPk(auctionId);
            if (!auction || !this.isAuctionActive(auction)) {
                throw new Error('Enchère non active');
            }

            const currentPrice = auction.actual_price || auction.initial_price;
            if (bid.amount <= currentPrice) {
                const error = new Error(`Enchère dépassée. Prix actuel: ${currentPrice}€`);
                error.currentPrice = currentPrice;
                throw error;
            }

            // Créer l'historique de l'enchère
            const historyBid = await HistoryAuction.create({
                id_history_auction: bid.bidId,
                amount: bid.amount,
                id_user: bid.userId,
                id_auction: auctionId
            });

            // Mettre à jour le prix actuel de l'enchère
            await auction.update({
                actual_price: bid.amount
            });

            // Récupérer les informations de l'utilisateur
            const user = await User.findByPk(bid.userId, {
                attributes: ['id_user', 'pseudo', 'photo']
            });

            const bidData = {
                id_bid: historyBid.id_history_auction,
                amount: bid.amount,
                user: {
                    id_user: user.id_user,
                    pseudo: user.pseudo,
                    photo: user.photo
                },
                timestamp: historyBid.createdAt,
                auctionId: auctionId
            };

            console.log(`✅ [AUCTION-SERVICE] Enchère placée: ${bid.amount}€ par ${user.pseudo}`);

            // Diffuser la nouvelle enchère à tous les participants
            if (this.io) {
                this.io.to(`auction_${auctionId}`).emit('new_bid', bidData);
                
                // Mettre à jour les détails de l'enchère
                const updatedAuction = await this.getAuctionDetails(auctionId);
                this.io.to(`auction_${auctionId}`).emit('auction_updated', updatedAuction);
            }

            // Prolonger l'enchère si proche de la fin (dernières 2 minutes)
            const timeRemaining = this.calculateTimeRemaining(auction.end_date);
            if (timeRemaining > 0 && timeRemaining < 2 * 60 * 1000) { // 2 minutes
                const newEndDate = new Date(auction.end_date.getTime() + 2 * 60 * 1000); // +2 minutes
                await auction.update({ end_date: newEndDate });
                
                if (this.io) {
                    this.io.to(`auction_${auctionId}`).emit('auction_extended', {
                        auctionId: auctionId,
                        newEndDate: newEndDate,
                        message: 'Enchère prolongée de 2 minutes'
                    });
                }
                
                console.log(`⏰ [AUCTION-SERVICE] Enchère ${auctionId} prolongée de 2 minutes`);
            }

            bid.resolve(bidData);

        } catch (error) {
            console.error(`❌ [AUCTION-SERVICE] Erreur lors du traitement de l'enchère:`, error);
            bid.reject(error);
        }

        // Traiter la prochaine enchère dans la queue
        if (queue.length > 0) {
            setTimeout(() => this.processBidQueue(auctionId), 100);
        }
    }

    /**
     * Récupérer la dernière enchère
     */
    async getLastBid(auctionId) {
        try {
            const lastBid = await HistoryAuction.findOne({
                where: { id_auction: auctionId },
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['id_user', 'pseudo', 'photo']
                }],
                order: [['createdAt', 'DESC']]
            });

            if (!lastBid) return null;

            return {
                id_bid: lastBid.id_history_auction,
                amount: lastBid.amount,
                user: {
                    id_user: lastBid.User.id_user,
                    pseudo: lastBid.User.pseudo,
                    photo: lastBid.User.photo
                },
                timestamp: lastBid.createdAt
            };
        } catch (error) {
            console.error('Erreur lors de la récupération de la dernière enchère:', error);
            return null;
        }
    }

    /**
     * Récupérer l'historique des enchères
     */
    async getBidHistory(auctionId, limit = 20, offset = 0) {
        try {
            const bids = await HistoryAuction.findAll({
                where: { id_auction: auctionId },
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['id_user', 'pseudo', 'photo']
                }],
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset
            });

            return bids.map(bid => ({
                id_bid: bid.id_history_auction,
                amount: bid.amount,
                user: {
                    id_user: bid.User.id_user,
                    pseudo: bid.User.pseudo,
                    photo: bid.User.photo
                },
                timestamp: bid.createdAt
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            throw error;
        }
    }

    /**
     * Compter le nombre de participants uniques
     */
    async getParticipantCount(auctionId) {
        try {
            const count = await HistoryAuction.count({
                where: { id_auction: auctionId },
                distinct: true,
                col: 'id_user'
            });
            return count;
        } catch (error) {
            console.error('Erreur lors du comptage des participants:', error);
            return 0;
        }
    }

    /**
     * Calculer le temps restant
     */
    calculateTimeRemaining(endDate) {
        const now = new Date();
        const end = new Date(endDate);
        return Math.max(0, end.getTime() - now.getTime());
    }

    /**
     * Vérifier si une enchère est active
     */
    isAuctionActive(auction) {
        const now = new Date();
        const start = new Date(auction.start_date);
        const end = new Date(auction.end_date);
        
        return now >= start && now <= end;
    }

    /**
     * Obtenir le statut d'une enchère
     */
    getAuctionStatus(auction) {
        const now = new Date();
        const start = new Date(auction.start_date);
        const end = new Date(auction.end_date);

        if (now < start) return 'upcoming';
        if (now > end) return 'ended';
        return 'active';
    }

    /**
     * Démarrer le monitoring des enchères actives
     */
    startAuctionMonitoring() {
        console.log('🔄 [AUCTION-SERVICE] Démarrage du monitoring des enchères');
        
        // Vérifier toutes les minutes
        setInterval(async () => {
            await this.checkEndingAuctions();
        }, 60000); // 1 minute

        // Vérification initiale
        this.checkEndingAuctions();
    }

    /**
     * Vérifier les enchères qui se terminent
     */
    async checkEndingAuctions() {
        try {
            const now = new Date();
            const soon = new Date(now.getTime() + 5 * 60 * 1000); // Dans 5 minutes

            // Enchères qui se terminent bientôt
            const endingSoon = await Auction.findAll({
                where: {
                    end_date: {
                        [Op.between]: [now, soon]
                    }
                }
            });

            for (const auction of endingSoon) {
                const timeRemaining = this.calculateTimeRemaining(auction.end_date);
                
                if (this.io && timeRemaining > 0) {
                    this.io.to(`auction_${auction.id_auction}`).emit('auction_ending_soon', {
                        auctionId: auction.id_auction,
                        timeRemaining: timeRemaining,
                        message: `L'enchère se termine dans ${Math.ceil(timeRemaining / 60000)} minutes`
                    });
                }
            }

            // Enchères terminées
            const endedAuctions = await Auction.findAll({
                where: {
                    end_date: {
                        [Op.lt]: now
                    }
                }
            });

            for (const auction of endedAuctions) {
                await this.finalizeAuction(auction.id_auction);
            }

        } catch (error) {
            console.error('❌ [AUCTION-SERVICE] Erreur lors de la vérification des enchères:', error);
        }
    }

    /**
     * Finaliser une enchère terminée
     */
    async finalizeAuction(auctionId) {
        try {
            console.log(`🏁 [AUCTION-SERVICE] Finalisation de l'enchère ${auctionId}`);

            const auction = await this.getAuctionDetails(auctionId);
            const winner = auction.lastBid ? auction.lastBid.user : null;

            if (this.io) {
                this.io.to(`auction_${auctionId}`).emit('auction_ended', {
                    auctionId: auctionId,
                    winner: winner,
                    finalPrice: auction.actual_price,
                    message: winner ? 
                        `Enchère remportée par ${winner.pseudo} pour ${auction.actual_price}€` :
                        'Enchère terminée sans gagnant'
                });
            }

            // Nettoyer les caches
            this.activeAuctions.delete(auctionId);
            this.bidQueue.delete(auctionId);

        } catch (error) {
            console.error(`❌ [AUCTION-SERVICE] Erreur lors de la finalisation:`, error);
        }
    }
}

module.exports = AuctionRealtimeService;
