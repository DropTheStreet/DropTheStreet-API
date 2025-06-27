const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const { CartItem } = require('../../models/models/cart/cart_item.model');
const CartItemRepository = require("../../models/repositories/cart/cart_item-repository");

// Route pour créer une session de paiement Stripe
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { id_user, currency = 'eur' } = req.body;

        // Récupérer les items du panier
        const cartItems = await CartItemRepository.findByUserId(id_user);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Panier vide' });
        }

        // Calculer le montant total
        const totalAmount = cartItems.reduce((total, item) => {
            if (item.Drop) return total + parseFloat(item.Drop.price);
            if (item.Auction) return total + item.Auction.actual_price;
            return total;
        }, 0);

        // Créer le PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Stripe utilise les centimes
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: id_user,
                cartItems: JSON.stringify(cartItems.map(item => ({
                    id: item.id_cart_item,
                    productName: item.Product.name,
                    price: item.Drop ? parseFloat(item.Drop.price) : item.Auction.actual_price
                })))
            }
        });

        res.status(200).json({
            client_secret: paymentIntent.client_secret,
            amount: totalAmount
        });

    } catch (error) {
        console.error('Erreur création PaymentIntent:', error);
        res.status(500).json({
            message: 'Erreur lors de la création du paiement',
            error: error.message
        });
    }
});

// Route pour créer une session Checkout (alternative)
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { id_user, success_url, cancel_url } = req.body;

        const cartItems = await CartItemRepository.findByUserId(id_user);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Panier vide' });
        }

        // Préparer les line items pour Stripe
        const lineItems = cartItems.map(item => {
            const price = item.Drop ? parseFloat(item.Drop.price) : item.Auction.actual_price;
            const size = item.Drop ? item.Drop.size : item.Auction.size;
            const type = item.Drop ? 'Drop' : 'Enchère';

            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `${item.Product.name} (${type})`,
                        description: `Taille: ${size}`,
                        images: item.Product.ProductImages?.[0] ?
                            [`data:image/jpeg;base64,${Buffer.from(item.Product.ProductImages[0].Image.image.data).toString("base64")}`] :
                            []
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: success_url,
            cancel_url: cancel_url,
            metadata: {
                userId: id_user
            }
        });

        res.status(200).json({ sessionId: session.id, url: session.url });

    } catch (error) {
        console.error('Erreur création session Checkout:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de la session',
            error: error.message
        });
    }
});

// Webhook pour gérer les événements Stripe
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer les événements
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handlePaymentSuccess(paymentIntent);
            break;

        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutSuccess(session);
            break;

        default:
            console.log(`Événement non géré: ${event.type}`);
    }

    res.json({received: true});
});

// Fonction pour traiter un paiement réussi (PaymentIntent)
async function handlePaymentSuccess(paymentIntent) {
    try {
        const userId = paymentIntent.metadata.userId;
        const cartItems = await CartItemRepository.findByUserId(userId);

        console.log('🎉 Paiement réussi:', paymentIntent.id);

        if (!cartItems || cartItems.length === 0) {
            console.log('⚠️ Aucun article dans le panier pour l\'utilisateur:', userId);
            return;
        }

        // 1. Créer l'enregistrement Payment
        const payment = await createPaymentRecord(paymentIntent, cartItems);

        // 2. Traiter chaque article du panier
        for (const item of cartItems) {
            await processCartItem(item, payment.id_payment);
        }

        // 3. Vider le panier
        const deletedCount = await CartItem.destroy({
            where: { id_user: userId }
        });
        console.log(`🗑️ Panier vidé (${deletedCount} articles supprimés)`);
        console.log(`✅ Paiement traité avec succès pour l'utilisateur ${userId}`);

    } catch (error) {
        console.error('❌ Erreur traitement paiement:', error);
    }
}

// Fonction pour traiter une session checkout réussie
async function handleCheckoutSuccess(session) {
    try {
        const userId = session.metadata.userId;
        const cartItems = await CartItemRepository.findByUserId(userId);

        console.log('🎉 Session Checkout complétée:', session.id);

        if (!cartItems || cartItems.length === 0) {
            console.log('⚠️ Aucun article dans le panier pour l\'utilisateur:', userId);
            return;
        }

        // 1. Créer l'enregistrement Payment
        const payment = await createPaymentRecordFromSession(session, cartItems);

        // 2. Traiter chaque article du panier
        for (const item of cartItems) {
            await processCartItem(item, payment.id_payment);
        }

        // 3. Vider le panier
        const deletedCount = await CartItem.destroy({
            where: { id_user: userId }
        });
        console.log(`🗑️ Panier vidé (${deletedCount} articles supprimés)`);
        console.log(`✅ Checkout traité avec succès pour l'utilisateur ${userId}`);

    } catch (error) {
        console.error('❌ Erreur traitement checkout:', error);
    }
}

// Créer l'enregistrement Payment depuis PaymentIntent
async function createPaymentRecord(paymentIntent, cartItems) {
    const { Payment } = require('../../models/models/cart/payment.model');
    const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
    const { v4: uuidv4 } = require('uuid');

    try {
        // Obtenir le statut "Completed"
        const completedStatus = await PaymentStatus.findOne({ where: { name: 'Completed' } });
        if (!completedStatus) {
            throw new Error('Statut de paiement "Completed" non trouvé');
        }

        // Déterminer le vendeur (premier item du panier)
        const firstItem = cartItems[0];
        let sellerId = null;

        if (firstItem?.Drop?.id_vendor) {
            sellerId = firstItem.Drop.id_vendor;
        } else if (firstItem?.Auction?.id_user) {
            sellerId = firstItem.Auction.id_user;
        } else {
            // Utiliser l'acheteur comme vendeur par défaut
            sellerId = paymentIntent.metadata.userId;
        }

        return await Payment.create({
            id_payment: uuidv4(),
            id_user: paymentIntent.metadata.userId,
            id_seller: sellerId,
            id_payment_status: completedStatus.id_payment_status,
            amount_total: paymentIntent.amount / 100, // Convertir centimes en euros
            delivery_address: paymentIntent.metadata.deliveryAddress || 'Adresse non fournie',
            payment_date: new Date()
        });
    } catch (error) {
        console.error('❌ Erreur création Payment depuis PaymentIntent:', error);
        throw error;
    }
}

// Créer l'enregistrement Payment depuis Session
async function createPaymentRecordFromSession(session, cartItems) {
    const { Payment } = require('../../models/models/cart/payment.model');
    const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
    const { v4: uuidv4 } = require('uuid');

    try {
        // Obtenir le statut "Completed"
        const completedStatus = await PaymentStatus.findOne({ where: { name: 'Completed' } });
        if (!completedStatus) {
            throw new Error('Statut de paiement "Completed" non trouvé');
        }

        // Calculer le montant total
        const totalAmount = cartItems.reduce((total, item) => {
            if (item.Drop) return total + parseFloat(item.Drop.price);
            if (item.Auction) return total + item.Auction.actual_price;
            return total;
        }, 0);

        // Déterminer le vendeur
        const firstItem = cartItems[0];
        let sellerId = null;

        if (firstItem?.Drop?.id_vendor) {
            sellerId = firstItem.Drop.id_vendor;
        } else if (firstItem?.Auction?.id_user) {
            sellerId = firstItem.Auction.id_user;
        } else {
            // Utiliser l'acheteur comme vendeur par défaut
            sellerId = session.metadata.userId;
        }

        return await Payment.create({
            id_payment: uuidv4(),
            id_user: session.metadata.userId,
            id_seller: sellerId,
            id_payment_status: completedStatus.id_payment_status,
            amount_total: totalAmount,
            delivery_address: session.metadata.deliveryAddress || 'Adresse non fournie',
            payment_date: new Date()
        });
    } catch (error) {
        console.error('❌ Erreur création Payment depuis Session:', error);
        throw error;
    }
}

// Traiter un article du panier
async function processCartItem(item, paymentId) {
    const { PaymentDetail } = require('../../models/models/cart/payment_detail.model');
    const { Drop } = require('../../models/models/drop/drop.model');
    const { Auction } = require('../../models/models/auction/auction.model');
    const { v4: uuidv4 } = require('uuid');

    try {
        // 1. Créer le PaymentDetail
        const price = item.Drop ? parseFloat(item.Drop.price) : item.Auction.actual_price;

        await PaymentDetail.create({
            id_payment_detail: uuidv4(),
            id_payment: paymentId,
            id_product: item.id_product,
            quantity: 1,
            price_at_purchase: price
        });

        console.log(`💾 PaymentDetail créé pour le produit ${item.id_product}`);

        // 2. Traiter selon le type (Drop ou Auction)
        if (item.Drop) {
            // Diminuer la quantité du drop de 1
            const drop = await Drop.findByPk(item.id_drop);
            if (drop && drop.quantity > 0) {
                const oldQuantity = drop.quantity;
                await drop.update({ quantity: drop.quantity - 1 });
                console.log(`📦 Drop ${item.id_drop} quantité mise à jour: ${oldQuantity} → ${drop.quantity}`);
            } else {
                console.warn(`⚠️ Drop ${item.id_drop} non trouvé ou quantité insuffisante`);
            }
        } else if (item.Auction) {
            // Marquer l'enchère comme non disponible au lieu de la supprimer
            const auction = await Auction.findByPk(item.id_auction);
            if (auction) {
                await auction.update({ disponible: false });
                console.log(`🏛️ Enchère ${item.id_auction} marquée comme non disponible`);
            } else {
                console.warn(`⚠️ Enchère ${item.id_auction} non trouvée`);
            }
        }

    } catch (error) {
        console.error(`❌ Erreur traitement article:`, error);
        throw error;
    }
}

module.exports = {
    initializeRoutes: () => router,
};