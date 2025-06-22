const cron = require('node-cron');
const { Auction } = require('../models/models/auction/auction.model');
const { HistoryAuction } = require('../models/models/auction/history_auction.model');
const { User } = require('../models/models/user/user.model');
const { Product } = require('../models/models/product/product.model');
const AuctionEndService = require('../services/auction-end.service');
const { Op } = require('sequelize');

class AuctionMonitorJob {
    constructor(io) {
        this.io = io;
        this.auctionEndService = new AuctionEndService(io);
        this.isRunning = false;
    }

    /**
     * Démarrer le monitoring des enchères
     */
    start() {
        console.log('🔄 [AUCTION-MONITOR] Démarrage du monitoring des enchères');

        // Job principal : vérifier toutes les minutes
        cron.schedule('* * * * *', async () => {
            if (this.isRunning) {
                console.log('⏳ [AUCTION-MONITOR] Job déjà en cours, skip...');
                return;
            }

            try {
                this.isRunning = true;
                await this.checkEndingAuctions();
            } catch (error) {
                console.error('❌ [AUCTION-MONITOR] Erreur dans le job:', error);
            } finally {
                this.isRunning = false;
            }
        });

        // Job de nettoyage : toutes les heures
        cron.schedule('0 * * * *', async () => {
            await this.cleanupOldAuctions();
        });

        console.log('✅ [AUCTION-MONITOR] Jobs programmés avec succès');
    }

    /**
     * Vérifier les enchères qui se terminent
     */
    async checkEndingAuctions() {
        try {
            const now = new Date();
            
            // Trouver les enchères qui viennent de se terminer (dans les 2 dernières minutes)
            const endedAuctions = await Auction.findAll({
                where: {
                    end_date: {
                        [Op.lte]: now,
                        [Op.gte]: new Date(now.getTime() - 2 * 60 * 1000) // 2 minutes avant
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id_user', 'pseudo', 'email']
                    },
                    {
                        model: Product,
                        attributes: ['id_product', 'name']
                    }
                ]
            });

            if (endedAuctions.length > 0) {
                console.log(`🏁 [AUCTION-MONITOR] ${endedAuctions.length} enchère(s) terminée(s) détectée(s)`);

                for (const auction of endedAuctions) {
                    await this.processEndedAuction(auction);
                }
            }

            // Vérifier les enchères qui se terminent bientôt (dans 5 minutes)
            await this.checkSoonEndingAuctions();

        } catch (error) {
            console.error('❌ [AUCTION-MONITOR] Erreur lors de la vérification:', error);
        }
    }

    /**
     * Traiter une enchère terminée
     */
    async processEndedAuction(auction) {
        try {
            console.log(`🏁 [AUCTION-MONITOR] Traitement de l'enchère terminée: ${auction.id_auction}`);

            // Finaliser l'enchère
            const result = await this.auctionEndService.finalizeAuction(auction.id_auction);

            if (result.success) {
                console.log(`✅ [AUCTION-MONITOR] Enchère ${auction.id_auction} finalisée avec succès`);
                
                // Notifier via WebSocket
                this.io.emit('auction_ended', {
                    auctionId: auction.id_auction,
                    winner: result.winner,
                    finalPrice: result.finalPrice,
                    message: result.message
                });

                // Notifier spécifiquement le gagnant
                if (result.winner) {
                    this.io.to(`user_${result.winner.id_user}`).emit('auction_won', {
                        auctionId: auction.id_auction,
                        product: auction.Product,
                        finalPrice: result.finalPrice,
                        message: 'Félicitations ! Vous avez remporté cette enchère. L\'article a été ajouté à votre panier.',
                        paymentDeadline: result.paymentDeadline
                    });
                }

            } else {
                console.log(`⚠️ [AUCTION-MONITOR] Enchère ${auction.id_auction} sans gagnant`);
            }

        } catch (error) {
            console.error(`❌ [AUCTION-MONITOR] Erreur lors du traitement de l'enchère ${auction.id_auction}:`, error);
        }
    }

    /**
     * Vérifier les enchères qui se terminent bientôt
     */
    async checkSoonEndingAuctions() {
        try {
            const now = new Date();
            const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000);

            const soonEndingAuctions = await Auction.findAll({
                where: {
                    end_date: {
                        [Op.between]: [now, in5Minutes]
                    }
                }
            });

            for (const auction of soonEndingAuctions) {
                // Notifier les participants que l'enchère se termine bientôt
                this.io.to(`auction_${auction.id_auction}`).emit('auction_ending_soon', {
                    auctionId: auction.id_auction,
                    timeRemaining: auction.end_date.getTime() - now.getTime(),
                    message: 'Cette enchère se termine dans moins de 5 minutes !'
                });
            }

        } catch (error) {
            console.error('❌ [AUCTION-MONITOR] Erreur lors de la vérification des enchères bientôt terminées:', error);
        }
    }

    /**
     * Nettoyer les anciennes enchères
     */
    async cleanupOldAuctions() {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            // Marquer les enchères très anciennes comme archivées
            const archivedCount = await Auction.update(
                { status: 'archived' },
                {
                    where: {
                        end_date: {
                            [Op.lt]: oneWeekAgo
                        },
                        status: 'ended'
                    }
                }
            );

            if (archivedCount[0] > 0) {
                console.log(`🗄️ [AUCTION-MONITOR] ${archivedCount[0]} enchère(s) archivée(s)`);
            }

        } catch (error) {
            console.error('❌ [AUCTION-MONITOR] Erreur lors du nettoyage:', error);
        }
    }

    /**
     * Arrêter le monitoring
     */
    stop() {
        console.log('🛑 [AUCTION-MONITOR] Arrêt du monitoring des enchères');
        // Les jobs cron s'arrêtent automatiquement quand le processus se termine
    }
}

module.exports = AuctionMonitorJob;
