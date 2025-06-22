const cron = require('node-cron');
const { CartItem } = require('../models/models/cart/cart_item.model');
const { User } = require('../models/models/user/user.model');
const { Product } = require('../models/models/product/product.model');
const { Op } = require('sequelize');

class PaymentReminderJob {
    constructor(io) {
        this.io = io;
    }

    /**
     * Démarrer les rappels de paiement
     */
    start() {
        console.log('💳 [PAYMENT-REMINDER] Démarrage des rappels de paiement');

        // Job toutes les heures pour vérifier les paiements
        cron.schedule('0 * * * *', async () => {
            await this.checkPaymentReminders();
        });

        // Job toutes les 6 heures pour les paiements en retard
        cron.schedule('0 */6 * * *', async () => {
            await this.checkOverduePayments();
        });

        console.log('✅ [PAYMENT-REMINDER] Jobs de rappel programmés');
    }

    /**
     * Vérifier et envoyer les rappels de paiement
     */
    async checkPaymentReminders() {
        try {
            const now = new Date();
            
            // Rappel 24h avant expiration
            const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            await this.sendReminders(now, in24Hours, '24h');

            // Rappel 6h avant expiration
            const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000);
            await this.sendReminders(now, in6Hours, '6h');

            // Rappel 1h avant expiration
            const in1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
            await this.sendReminders(now, in1Hour, '1h');

        } catch (error) {
            console.error('❌ [PAYMENT-REMINDER] Erreur lors des rappels:', error);
        }
    }

    /**
     * Envoyer des rappels pour une période donnée
     */
    async sendReminders(now, deadline, period) {
        try {
            const itemsToRemind = await CartItem.findAll({
                where: {
                    is_auction_item: true,
                    must_pay_before: {
                        [Op.between]: [now, deadline]
                    },
                    // Ajouter condition pour "non payé" selon votre logique
                    payment_status: {
                        [Op.or]: [null, 'pending']
                    }
                },
                include: [
                    {
                        model: User,
                        attributes: ['id_user', 'pseudo', 'email']
                    },
                    {
                        model: Product,
                        attributes: ['id_product', 'name', 'price']
                    }
                ]
            });

            for (const item of itemsToRemind) {
                await this.sendPaymentReminder(item, period);
            }

            if (itemsToRemind.length > 0) {
                console.log(`📧 [PAYMENT-REMINDER] ${itemsToRemind.length} rappel(s) envoyé(s) pour ${period}`);
            }

        } catch (error) {
            console.error(`❌ [PAYMENT-REMINDER] Erreur lors des rappels ${period}:`, error);
        }
    }

    /**
     * Envoyer un rappel de paiement individuel
     */
    async sendPaymentReminder(cartItem, period) {
        try {
            const timeLeft = cartItem.must_pay_before.getTime() - new Date().getTime();
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            let urgencyLevel = 'info';
            let message = '';

            switch (period) {
                case '24h':
                    urgencyLevel = 'warning';
                    message = `Rappel: Il vous reste 24h pour payer votre enchère remportée.`;
                    break;
                case '6h':
                    urgencyLevel = 'warning';
                    message = `Attention: Il vous reste seulement 6h pour payer votre enchère !`;
                    break;
                case '1h':
                    urgencyLevel = 'error';
                    message = `URGENT: Il vous reste moins d'1h pour payer votre enchère !`;
                    break;
            }

            // Envoyer notification WebSocket
            this.io.to(`user_${cartItem.User.id_user}`).emit('payment_reminder', {
                type: urgencyLevel,
                message: message,
                cartItem: {
                    id: cartItem.id_cart_item,
                    product: cartItem.Product,
                    price: cartItem.price,
                    deadline: cartItem.must_pay_before
                },
                timeLeft: {
                    hours: hoursLeft,
                    minutes: minutesLeft,
                    total: timeLeft
                },
                actions: {
                    payNow: `/cart/pay/${cartItem.id_cart_item}`,
                    viewCart: '/cart'
                }
            });

            console.log(`📧 [PAYMENT-REMINDER] Rappel ${period} envoyé à ${cartItem.User.pseudo}`);

        } catch (error) {
            console.error('❌ [PAYMENT-REMINDER] Erreur lors de l\'envoi du rappel:', error);
        }
    }

    /**
     * Vérifier les paiements en retard
     */
    async checkOverduePayments() {
        try {
            const now = new Date();

            const overdueItems = await CartItem.findAll({
                where: {
                    is_auction_item: true,
                    must_pay_before: {
                        [Op.lt]: now
                    },
                    payment_status: {
                        [Op.or]: [null, 'pending']
                    }
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
                await this.handleOverdueItem(item);
            }

            if (overdueItems.length > 0) {
                console.log(`🚫 [PAYMENT-REMINDER] ${overdueItems.length} article(s) en retard traité(s)`);
            }

        } catch (error) {
            console.error('❌ [PAYMENT-REMINDER] Erreur lors de la vérification des retards:', error);
        }
    }

    /**
     * Gérer un article en retard de paiement
     */
    async handleOverdueItem(cartItem) {
        try {
            console.log(`🚫 [PAYMENT-REMINDER] Traitement retard: ${cartItem.User.pseudo}`);

            // 1. Marquer comme en retard
            await cartItem.update({
                payment_status: 'overdue',
                overdue_since: new Date()
            });

            // 2. Notifier l'utilisateur
            this.io.to(`user_${cartItem.User.id_user}`).emit('payment_overdue', {
                type: 'error',
                message: 'Votre paiement d\'enchère est en retard !',
                cartItem: {
                    id: cartItem.id_cart_item,
                    product: cartItem.Product,
                    price: cartItem.price
                },
                consequences: [
                    'L\'article sera retiré de votre panier dans 24h',
                    'Des sanctions peuvent être appliquées à votre compte',
                    'Risque de bannissement en cas de récidive'
                ],
                actions: {
                    payNow: `/cart/pay/${cartItem.id_cart_item}`,
                    contact: '/support'
                }
            });

            // 3. Programmer la suppression définitive (24h de grâce)
            setTimeout(async () => {
                await this.removeOverdueItem(cartItem.id_cart_item);
            }, 24 * 60 * 60 * 1000); // 24h

        } catch (error) {
            console.error('❌ [PAYMENT-REMINDER] Erreur lors du traitement du retard:', error);
        }
    }

    /**
     * Supprimer définitivement un article en retard
     */
    async removeOverdueItem(cartItemId) {
        try {
            const cartItem = await CartItem.findByPk(cartItemId, {
                include: [
                    { model: User, attributes: ['id_user', 'pseudo'] },
                    { model: Product, attributes: ['name'] }
                ]
            });

            if (!cartItem) return;

            // Vérifier si toujours non payé
            if (cartItem.payment_status === 'overdue') {
                await cartItem.destroy();

                // Notifier la suppression
                this.io.to(`user_${cartItem.User.id_user}`).emit('auction_item_removed', {
                    message: 'L\'article d\'enchère a été retiré de votre panier pour non-paiement.',
                    product: cartItem.Product.name,
                    warning: 'Attention aux futures enchères - risque de sanctions.'
                });

                console.log(`🗑️ [PAYMENT-REMINDER] Article supprimé: ${cartItem.Product.name} (${cartItem.User.pseudo})`);

                // TODO: Implémenter la logique de sanctions/bannissement
            }

        } catch (error) {
            console.error('❌ [PAYMENT-REMINDER] Erreur lors de la suppression:', error);
        }
    }
}

module.exports = PaymentReminderJob;
