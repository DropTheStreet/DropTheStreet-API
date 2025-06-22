const { Auction } = require('../models/models/auction/auction.model');
const { HistoryAuction } = require('../models/models/auction/history_auction.model');
const { User } = require('../models/models/user/user.model');
const { Product } = require('../models/models/product/product.model');
const { CartItem } = require('../models/models/cart/cart_item.model');
const { sequelize } = require('../models/mysql.db');
const { Op } = require('sequelize');

class AuctionEndService {
    constructor(io) {
        this.io = io;
    }

    /**
     * Finaliser une enchère terminée
     */
    async finalizeAuction(auctionId) {
        const transaction = await sequelize.transaction();

        try {
            console.log(`🏁 [AUCTION-END] Début de finalisation pour l'enchère: ${auctionId}`);

            // 1. Récupérer l'enchère avec ses détails
            const auction = await Auction.findByPk(auctionId, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id_user', 'pseudo', 'email']
                    },
                    {
                        model: Product,
                        attributes: ['id_product', 'name', 'description']
                    }
                ],
                transaction
            });

            if (!auction) {
                throw new Error('Enchère non trouvée');
            }

            // 2. Trouver le gagnant (dernière enchère la plus élevée)
            const winningBid = await HistoryAuction.findOne({
                where: { id_auction: auctionId },
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['id_user', 'pseudo', 'email']
                }],
                order: [['amount', 'DESC'], ['createdAt', 'DESC']],
                transaction
            });

            // 3. Marquer l'enchère comme terminée
            await auction.update({
                status: 'ended',
                ended_at: new Date()
            }, { transaction });

            // 4. Si pas de gagnant (aucune enchère)
            if (!winningBid) {
                await transaction.commit();
                
                console.log(`⚠️ [AUCTION-END] Aucun gagnant pour l'enchère ${auctionId}`);
                
                return {
                    success: true,
                    hasWinner: false,
                    message: 'Enchère terminée sans gagnant',
                    auctionId: auctionId
                };
            }

            // 5. Traiter le gagnant
            const winner = winningBid.User;
            const finalPrice = winningBid.amount;

            console.log(`🏆 [AUCTION-END] Gagnant: ${winner.pseudo} avec ${finalPrice}€`);

            // 6. Ajouter l'article au panier du gagnant
            const cartResult = await this.addWinningItemToCart(
                winner.id_user, 
                auction.Product, 
                finalPrice, 
                auctionId, 
                transaction
            );

            // 7. Marquer l'enchère gagnante
            await winningBid.update({
                is_winning_bid: true,
                processed_at: new Date()
            }, { transaction });

            // 8. Définir la deadline de paiement (48h)
            const paymentDeadline = new Date();
            paymentDeadline.setHours(paymentDeadline.getHours() + 48);

            // 9. Créer une entrée de suivi de paiement
            await this.createPaymentTracking(
                winner.id_user,
                auctionId,
                finalPrice,
                paymentDeadline,
                transaction
            );

            await transaction.commit();

            console.log(`✅ [AUCTION-END] Enchère ${auctionId} finalisée avec succès`);

            return {
                success: true,
                hasWinner: true,
                winner: {
                    id_user: winner.id_user,
                    pseudo: winner.pseudo,
                    email: winner.email
                },
                finalPrice: finalPrice,
                cartItemId: cartResult.cartItemId,
                paymentDeadline: paymentDeadline,
                message: `Enchère remportée par ${winner.pseudo} pour ${finalPrice}€`
            };

        } catch (error) {
            await transaction.rollback();
            console.error(`❌ [AUCTION-END] Erreur lors de la finalisation de l'enchère ${auctionId}:`, error);
            throw error;
        }
    }

    /**
     * Ajouter l'article gagné au panier
     */
    async addWinningItemToCart(userId, product, finalPrice, auctionId, transaction) {
        try {
            // Vérifier si l'article n'est pas déjà dans le panier
            const existingCartItem = await CartItem.findOne({
                where: {
                    id_user: userId,
                    id_product: product.id_product,
                    id_auction : auctionId
                },
                transaction
            });

            if (existingCartItem) {
                console.log(`⚠️ [AUCTION-END] Article déjà dans le panier pour l'utilisateur ${userId}`);
                return { cartItemId: existingCartItem.id_cart_item };
            }

            // Créer l'item dans le panier
            const cartItem = await CartItem.create({
                id_user: userId,
                id_product: product.id_product,
                quantity: 1,
                price: finalPrice, // Prix de l'enchère, pas le prix original
                id_auction: auctionId,
                is_auction_item: true,
                must_pay_before: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
                created_at: new Date()
            }, { transaction });

            console.log(`🛒 [AUCTION-END] Article ajouté au panier: ${cartItem.id_cart_item}`);

            return { cartItemId: cartItem.id_cart_item };

        } catch (error) {
            console.error(`❌ [AUCTION-END] Erreur lors de l'ajout au panier:`, error);
            throw error;
        }
    }

    /**
     * Créer un suivi de paiement pour l'enchère
     */
    async createPaymentTracking(userId, auctionId, amount, deadline, transaction) {
        try {
            // Vous pouvez créer une table PaymentTracking ou utiliser une table existante
            // Pour l'instant, on peut utiliser les champs existants ou créer une nouvelle table

            console.log(`💳 [AUCTION-END] Suivi de paiement créé pour ${userId}: ${amount}€ avant ${deadline}`);

            // TODO: Implémenter selon votre structure de base de données
            // Exemple :
            /*
            await PaymentTracking.create({
                id_user: userId,
                id_auction: auctionId,
                amount: amount,
                deadline: deadline,
                status: 'pending',
                created_at: new Date()
            }, { transaction });
            */

        } catch (error) {
            console.error(`❌ [AUCTION-END] Erreur lors de la création du suivi de paiement:`, error);
            throw error;
        }
    }

    /**
     * Vérifier les paiements en retard
     */
    async checkOverduePayments() {
        try {
            const now = new Date();

            // Trouver les articles d'enchères non payés après la deadline
            const overdueItems = await CartItem.findAll({
                where: {
                    is_auction_item: true,
                    must_pay_before: {
                        [Op.lt]: now
                    },
                    // Ajouter condition pour "non payé" selon votre logique
                },
                include: [
                    {
                        model: User,
                        attributes: ['id_user', 'pseudo', 'email']
                    },
                    {
                        model: Product,
                        attributes: ['id_product', 'name']
                    }
                ]
            });

            for (const item of overdueItems) {
                await this.handleOverduePayment(item);
            }

        } catch (error) {
            console.error('❌ [AUCTION-END] Erreur lors de la vérification des paiements en retard:', error);
        }
    }

    /**
     * Gérer un paiement en retard
     */
    async handleOverduePayment(cartItem) {
        try {
            console.log(`⚠️ [AUCTION-END] Paiement en retard détecté: ${cartItem.User.pseudo}`);

            // 1. Supprimer l'article du panier
            await cartItem.destroy();

            // 2. Envoyer notification de bannissement (ou avertissement)
            this.io.to(`user_${cartItem.User.id_user}`).emit('payment_overdue', {
                message: 'Votre paiement d\'enchère est en retard. L\'article a été retiré de votre panier.',
                product: cartItem.Product,
                consequences: 'Attention: les retards de paiement peuvent entraîner des sanctions.'
            });

            // 3. Log pour suivi administratif
            console.log(`🚫 [AUCTION-END] Article retiré du panier pour paiement en retard: ${cartItem.User.pseudo}`);

            // TODO: Implémenter la logique de bannissement selon vos règles
            // - Compter les retards
            // - Appliquer des sanctions progressives
            // - Bannir après X retards

        } catch (error) {
            console.error('❌ [AUCTION-END] Erreur lors de la gestion du paiement en retard:', error);
        }
    }
}

module.exports = AuctionEndService;
