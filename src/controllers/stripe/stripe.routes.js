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
            console.log('Paiement réussi:', paymentIntent.id);

            // Ici vous pouvez :
            // - Vider le panier de l'utilisateur
            // - Créer une commande
            // - Envoyer un email de confirmation
            const userId = paymentIntent.metadata.userId;
            if (userId) {
                // Vider le panier après paiement réussi
                await CartItemRepository.clearUserCart(userId);
                console.log(`Panier vidé pour l'utilisateur ${userId}`);
            }
            break;

        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Session Checkout complétée:', session.id);

            const userIdFromSession = session.metadata.userId;
            if (userIdFromSession) {
                await CartItemRepository.clearUserCart(userIdFromSession);
                console.log(`Panier vidé pour l'utilisateur ${userIdFromSession}`);
            }
            break;

        default:
            console.log(`Événement non géré: ${event.type}`);
    }

    res.json({received: true});
});

module.exports = {
    initializeRoutes: () => router,
};