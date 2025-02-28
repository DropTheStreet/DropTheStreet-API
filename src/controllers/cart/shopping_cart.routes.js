const express = require('express');
const router = express.Router();
const { ShoppingCart } = require('../../models/models/cart/shopping_cart.model');
const { CartItem } = require('../../models/models/cart/cart_item.model');
const { v4: uuidv4 } = require('uuid');
const { Product } = require('../../models/models/product/product.model');
const { User } = require('../../models/models/user/user.model');

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

        const cartData = [
            {
                id_user: users[0].id_user,
                items: [
                    { id_product: products[0].id_product, quantity: 2, size: 'M' },
                    { id_product: products[1].id_product, quantity: 1, size: 'L' },
                ],
            },
            {
                id_user: users[1].id_user,
                items: [
                    { id_product: products[1].id_product, quantity: 3, size: 'S' },
                    { id_product: products[2].id_product, quantity: 1, size: 'M' },
                ],
            },
            {
                id_user: users[2].id_user,
                items: [
                    { id_product: products[2].id_product, quantity: 1, size: 'L' },
                ],
            },
        ];

        for (let cart of cartData) {
            const newCart = await ShoppingCart.create({
                id_shopping_cart: uuidv4(),
                id_user: cart.id_user,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            for (let item of cart.items) {
                await CartItem.create({
                    id_cart_item: uuidv4(),
                    id_shopping_cart: newCart.id_shopping_cart,
                    id_product: item.id_product,
                    quantity: item.quantity,
                    size: item.size,
                });
            }

            console.log(`ShoppingCart created successfully for user ${cart.id_user}`);
        }

        const allCarts = await ShoppingCart.findAll({ include: CartItem });

        res.status(200).send(allCarts);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error adding items to the cart', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const carts = await ShoppingCart.findAll({ include: CartItem });
        res.status(200).send(carts);
    } catch (e) {
        res.status(500).send({ message: 'Error getting all carts', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
