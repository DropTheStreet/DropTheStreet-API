const express = require('express');
const router = express.Router();
const { ShoppingCart } = require('../../models/models/cart/shopping_cart.model');
const { v4: uuidv4 } = require('uuid');
const {Product} = require("../../models/models/product/product.model");
const {User} = require("../../models/models/user/user.model");

router.post('/seeder', async (req, res) => {
    try {

        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }

        const cartItems = [
            {
                id_user: users[0].id_user,
                id_product: products[0].id_product,
                quantity: 3,
                size: 'M',
            },
            {
                id_user: users[1].id_user,
                id_product: products[1].id_product,
                quantity: 1,
                size: 'L',
            },
            {
                id_user: users[2].id_user,
                id_product: products[2].id_product,
                quantity: 2,
                size: 'S',
            }
        ];

        for (let item of cartItems) {
            await ShoppingCart.create({
                id_shopping_cart: uuidv4(),
                id_user: item.id_user,
                id_product: item.id_product,
                quantity: item.quantity,
                size: item.size,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Article was added to the cart : ${item.id_user} - ${item.id_product} - ${item.size}`);
        }

        const cart = await ShoppingCart.findAll();

        res.status(200).send(cart);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding article to the cart', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const cart = await ShoppingCart.findAll();
        res.status(200).send(cart);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting all carts', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
