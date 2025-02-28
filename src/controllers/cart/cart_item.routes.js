const express = require('express');
const router = express.Router();
const { CartItem } = require('../../models/models/cart/cart_item.model');

router.get('/', async (req, res) => {
    try {
        const cartItems = await CartItem.findAll();
        res.status(200).send(cartItems);
    } catch (e) {
        res.status(500).send({ message: 'Error getting cart items', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
