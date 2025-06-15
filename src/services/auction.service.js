const { Auction } = require('../models/models/auction/auction.model');
const { HistoryAuction } = require('../models/models/auction/history_auction.model');
const { Product } = require('../models/models/product/product.model');
const { User } = require('../models/models/user/user.model');
const AuctionRepository = require('../models/repositories/auction/auction-repository');
const HistoryAuctionRepository = require('../models/repositories/auction/history_auction-repository');

class AuctionService {
    constructor(socketHandler = null) {
        this.socketHandler = socketHandler;
        this.auctionTimers = new Map(); // Pour gérer les timers de fin d'enchères
    }

    // Définir le gestionnaire de sockets (appelé après l'initialisation)
    setSocketHandler(socketHandler) {
        this.socketHandler = socketHandler;
    }

    // Démarrer le monitoring des enchères actives
    async startAuctionMonitoring() {
        console.log('Démarrage du monitoring des enchères...');
        
        // Récupérer toutes les enchères actives
        const activeAuctions = await AuctionRepository.findActiveAuctions();
        
        // Programmer la fin de chaque enchère
        for (const auction of activeAuctions) {
            this.scheduleAuctionEnd(auction);
        }

        // Vérifier périodiquement les nouvelles enchères
        setInterval(async () => {
            await this.checkForNewAuctions();
        }, 60000); // Vérifier toutes les minutes

        console.log(`Monitoring démarré pour ${activeAuctions.length} enchères actives`);
    }

    // Programmer la fin d'une enchère
    scheduleAuctionEnd(auction) {
        const now = new Date();
        const endTime = new Date(auction.end_date);
        const timeUntilEnd = endTime.getTime() - now.getTime();

        if (timeUntilEnd <= 0) {
            // L'enchère est déjà terminée
            this.handleAuctionEnd(auction.id_auction);
            return;
        }

        // Programmer la fin de l'enchère
        const timer = setTimeout(() => {
            this.handleAuctionEnd(auction.id_auction);
        }, timeUntilEnd);

        this.auctionTimers.set(auction.id_auction, timer);

        console.log(`Fin d'enchère programmée pour ${auction.id_auction} dans ${Math.round(timeUntilEnd / 1000)} secondes`);
    }

    // Gérer la fin d'une enchère
    async handleAuctionEnd(auctionId) {
        try {
            console.log(`Traitement de la fin d'enchère: ${auctionId}`);

            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                console.error(`Enchère ${auctionId} non trouvée`);
                return;
            }

            // Récupérer le gagnant (dernière enchère la plus élevée)
            const winningBid = await HistoryAuction.findOne({
                where: { id_auction: auctionId },
                order: [['amount', 'DESC'], ['createdAt', 'DESC']],
                include: [{ model: User }]
            });

            const finalPrice = auction.actual_price || auction.initial_price;
            
            // Préparer les données de fin d'enchère
            const auctionEndData = {
                auctionId: auctionId,
                finalPrice: finalPrice,
                endTime: auction.end_date,
                winner: winningBid ? {
                    userId: winningBid.id_user,
                    amount: winningBid.amount,
                    user: winningBid.User
                } : null,
                totalBids: await HistoryAuction.count({ where: { id_auction: auctionId } })
            };

            // Notifier via WebSocket si disponible
            if (this.socketHandler) {
                this.socketHandler.broadcastToAuction(auctionId, 'auction_ended', auctionEndData);
                
                // Notifier spécifiquement le gagnant
                if (winningBid && winningBid.User) {
                    const winnerSocket = this.socketHandler.getUserSocket(winningBid.id_user);
                    if (winnerSocket) {
                        winnerSocket.emit('auction_won', {
                            ...auctionEndData,
                            message: 'Félicitations ! Vous avez remporté cette enchère !'
                        });
                    }
                }
            }

            // Nettoyer le timer
            if (this.auctionTimers.has(auctionId)) {
                clearTimeout(this.auctionTimers.get(auctionId));
                this.auctionTimers.delete(auctionId);
            }

            console.log(`Enchère ${auctionId} terminée. Prix final: ${finalPrice}€`);

        } catch (error) {
            console.error(`Erreur lors de la fin d'enchère ${auctionId}:`, error);
        }
    }

    // Vérifier les nouvelles enchères
    async checkForNewAuctions() {
        try {
            const activeAuctions = await AuctionRepository.findActiveAuctions();
            
            for (const auction of activeAuctions) {
                // Si cette enchère n'est pas encore monitorée
                if (!this.auctionTimers.has(auction.id_auction)) {
                    this.scheduleAuctionEnd(auction);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des nouvelles enchères:', error);
        }
    }

    // Créer une nouvelle enchère
    async createAuction(auctionData) {
        try {
            const auction = await AuctionRepository.create(auctionData);
            
            // Programmer la fin de cette nouvelle enchère
            this.scheduleAuctionEnd(auction);
            
            // Notifier tous les clients connectés d'une nouvelle enchère
            if (this.socketHandler) {
                this.socketHandler.io.emit('new_auction_created', {
                    auction: auction,
                    message: 'Une nouvelle enchère a été créée !'
                });
            }

            return auction;
        } catch (error) {
            console.error('Erreur lors de la création d\'enchère:', error);
            throw error;
        }
    }

    // Valider une enchère
    async validateBid(auctionId, userId, bidAmount) {
        try {
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                return { valid: false, message: 'Enchère non trouvée' };
            }

            // Vérifier que l'enchère est active
            const now = new Date();
            if (now > auction.end_date) {
                return { valid: false, message: 'Cette enchère est terminée' };
            }

            if (now < auction.start_date) {
                return { valid: false, message: 'Cette enchère n\'a pas encore commencé' };
            }

            // Vérifier que l'utilisateur n'est pas le propriétaire
            if (auction.id_user === userId) {
                return { valid: false, message: 'Vous ne pouvez pas enchérir sur votre propre produit' };
            }

            // Vérifier le montant
            const currentPrice = auction.actual_price || auction.initial_price;
            if (bidAmount <= currentPrice) {
                return { 
                    valid: false, 
                    message: `Le montant doit être supérieur à ${currentPrice}€`,
                    currentPrice: currentPrice
                };
            }

            return { valid: true, currentPrice: currentPrice };

        } catch (error) {
            console.error('Erreur lors de la validation d\'enchère:', error);
            return { valid: false, message: 'Erreur interne du serveur' };
        }
    }

    // Obtenir les statistiques des enchères
    async getAuctionStats() {
        try {
            const totalAuctions = await Auction.count();
            const activeAuctions = await Auction.count({
                where: {
                    end_date: {
                        [require('sequelize').Op.gte]: new Date()
                    }
                }
            });
            const totalBids = await HistoryAuction.count();
            const connectedUsers = this.socketHandler ? this.socketHandler.getConnectedUsersCount() : 0;

            return {
                totalAuctions,
                activeAuctions,
                totalBids,
                connectedUsers,
                monitoredAuctions: this.auctionTimers.size
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return null;
        }
    }

    // Nettoyer les timers (à appeler lors de l'arrêt du serveur)
    cleanup() {
        console.log('Nettoyage des timers d\'enchères...');
        this.auctionTimers.forEach((timer, auctionId) => {
            clearTimeout(timer);
            console.log(`Timer supprimé pour l'enchère ${auctionId}`);
        });
        this.auctionTimers.clear();
    }

    // Obtenir le temps restant pour une enchère
    getTimeRemaining(auction) {
        const now = new Date();
        const endTime = new Date(auction.end_date);
        const timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
        
        return {
            milliseconds: timeRemaining,
            seconds: Math.floor(timeRemaining / 1000),
            minutes: Math.floor(timeRemaining / (1000 * 60)),
            hours: Math.floor(timeRemaining / (1000 * 60 * 60)),
            days: Math.floor(timeRemaining / (1000 * 60 * 60 * 24)),
            isActive: timeRemaining > 0
        };
    }

    // Prolonger une enchère (fonction d'administration)
    async extendAuction(auctionId, additionalMinutes) {
        try {
            const auction = await Auction.findByPk(auctionId);
            if (!auction) {
                throw new Error('Enchère non trouvée');
            }

            const newEndDate = new Date(auction.end_date.getTime() + (additionalMinutes * 60 * 1000));
            
            await auction.update({ end_date: newEndDate });

            // Reprogrammer la fin d'enchère
            if (this.auctionTimers.has(auctionId)) {
                clearTimeout(this.auctionTimers.get(auctionId));
            }
            this.scheduleAuctionEnd(auction);

            // Notifier les participants
            if (this.socketHandler) {
                this.socketHandler.broadcastToAuction(auctionId, 'auction_extended', {
                    auctionId: auctionId,
                    newEndDate: newEndDate,
                    additionalMinutes: additionalMinutes,
                    message: `L'enchère a été prolongée de ${additionalMinutes} minutes`
                });
            }

            return auction;
        } catch (error) {
            console.error('Erreur lors de la prolongation d\'enchère:', error);
            throw error;
        }
    }
}

module.exports = AuctionService;
