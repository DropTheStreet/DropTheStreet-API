const express = require('express');
const router = express.Router();
const { ShoppingCart } = require('../../models/models/cart/shopping_cart.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Articles à ajouter dans le panier
        const cartItems = [
            {
                id_user: uuidv4(), // ID utilisateur, tu peux le remplacer par un ID existant
                id_product: uuidv4(), // ID produit, tu peux le remplacer par un ID existant
                quantity: 3,
                size: 'M',
            },
            {
                id_user: uuidv4(),
                id_product: uuidv4(),
                quantity: 1,
                size: 'L',
            },
            {
                id_user: uuidv4(),
                id_product: uuidv4(),
                quantity: 2,
                size: 'S',
            }
        ];

        // Création des articles dans le panier
        for (let item of cartItems) {
            await ShoppingCart.create({
                id_shopping_cart: uuidv4(),
                id_user: item.id_user,
                id_product: item.id_product,
                quantity: item.quantity,
                size: item.size,
                createdAt: new Date(),  // Date de création
                updatedAt: new Date(),  // Date de mise à jour
            });
            console.log(`Article ajouté au panier : ${item.id_user} - ${item.id_product} - ${item.size}`);
        }

        // Récupérer tous les articles du panier
        const cart = await ShoppingCart.findAll();

        // Retourner la liste des articles
        res.status(200).send(cart);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des articles au panier', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const cart = await ShoppingCart.findAll();
        res.status(200).send(cart);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des articles du panier', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
