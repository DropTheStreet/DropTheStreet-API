const express = require('express');
const router = express.Router();
const { CartItem } = require('../../models/models/cart/cart_item.model');
const {Product} = require("../../models/models/product/product.model");
const {User} = require("../../models/models/user/user.model");
const {Drop} = require("../../models/models/drop/drop.model");
const {Auction} = require("../../models/models/auction/auction.model");
const CartItemRepository = require("../../models/repositories/cart/cart_item-repository");

router.post('/seeder', async (req, res) => {
    try {
        const products = await Product.findAll();
        const users = await User.findAll();
        const drops = await Drop.findAll();
        const auctions = await Auction.findAll();

        if (products.length < 3 || users.length < 1) {
            return res.status(400).send({ message: 'Not enough products or users for seeding' });
        }

        const cartItemsToCreate = [
            {
                id_user: users[0].id_user,
                id_product: products[0].id_product,
                id_drop: drops.length > 0 ? drops[0].id_drop : null,
            },
            {
                id_user: users[1].id_user,
                id_product: products[1].id_product,
                id_auction: auctions.length > 0 ? auctions[0].id_auction : null,
            },
            {
                id_user: users[2].id_user,
                id_product: products[2].id_product,
                id_drop: drops.length > 1 ? drops[1].id_drop : null,
            },
            {
                id_user: users[1].id_user,
                id_product: products[2].id_product,
                id_drop: drops.length > 1 ? drops[2].id_drop : null,
            }
        ];

        const createdItems = [];

        for (let item of cartItemsToCreate) {
            const created = await CartItem.create({
                ...item,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`CartItem created with product ${item.id_product}`);
            createdItems.push(created);
        }

        res.status(200).send(createdItems);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during seeding cart items', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const cartItems = await CartItem.findAll();
        res.status(200).send(cartItems);
    } catch (e) {
        res.status(500).send({ message: 'Error getting cart items', error: e.message });
    }
});

router.get('/user/:id_user', async (req, res) => {
    try {
        const { id_user } = req.params;
        const items = await CartItemRepository.findByUserId(id_user);
        res.status(200).json(items);
    } catch (e) {
        res.status(500).json({ message: 'Erreur lors de la récupération des cart items par utilisateur', error: e.message });
    }
});

router.post('/create', async (req, res) => {
    try {
        const { id_user, id_product, id_drop, id_auction } = req.body;

        if (!id_user || !id_product) {
            return res.status(400).json({ message: 'id_user et id_product sont requis.' });
        }

        if ((id_drop && id_auction) || (!id_drop && !id_auction)) {
            return res.status(400).json({
                message: 'Vous devez fournir soit un id_drop, soit un id_auction, mais pas les deux.'
            });
        }

        const cartItem = await CartItemRepository.create({
            id_user,
            id_product,
            id_drop: id_drop || null,
            id_auction: id_auction || null
        });

        res.status(201).json(cartItem);
    } catch (error) {
        console.error('Erreur lors de la création du cart item :', error.message);
        res.status(500).json({ message: 'Erreur interne lors de l’ajout au panier.', error: error.message });
    }
});


router.delete('/:id_cart_item', async (req, res) => {
    try {
        const { id_cart_item } = req.params;
        const result = await CartItemRepository.deleteById(id_cart_item);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ message: 'Erreur lors de la suppression du cart item', error: e.message });
    }
});


module.exports = {
    initializeRoutes: () => router,
};
