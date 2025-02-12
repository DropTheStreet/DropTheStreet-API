const express = require('express');
const router = express.Router();
const { Payment } = require('../../models/models/cart/payment.model');
const { v4: uuidv4 } = require('uuid');
const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
const { User } = require('../../models/models/user/user.model');
const { Product } = require('../../models/models/product/product.model');

router.get('/seeder', async (req, res) => {
    try {
        // Récupérer un utilisateur, un produit et un statut de paiement existant
        const user = await User.findOne();
        const product = await Product.findOne();
        const paymentStatus = await PaymentStatus.findOne();

        if (!user || !product || !paymentStatus) {
            return res.status(400).send({ message: 'Utilisateur, produit ou statut de paiement introuvable.' });
        }

        // Liste des paiements fictifs à ajouter
        const payments = [
            {
                id_user: user.id_user,
                id_product: product.id_product_favorite,
                id_payment_status: paymentStatus.id_payment_status,
                amount_total: 150.00,
                delivery_address: '123 Rue Exemple, Paris, France',
                payment_date: new Date(),
            },
            {
                id_user: user.id_user,
                id_product: product.id_product_favorite,
                id_payment_status: paymentStatus.id_payment_status,
                amount_total: 100.50,
                delivery_address: '456 Avenue Exemple, Lyon, France',
                payment_date: new Date(),
            },
        ];

        // Création des paiements
        for (let payment of payments) {
            await Payment.create({
                id_payment: uuidv4(),
                id_user: payment.id_user,
                id_product: payment.id_product,
                id_payment_status: payment.id_payment_status,
                amount_total: payment.amount_total,
                delivery_address: payment.delivery_address,
                payment_date: payment.payment_date,
            });
            console.log(`Paiement ajouté pour l'utilisateur ${payment.id_user}`);
        }

        // Récupérer tous les paiements
        const allPayments = await Payment.findAll();

        // Retourner la liste des paiements
        res.status(200).send(allPayments);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des paiements', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.status(200).send(payments);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des paiements', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
