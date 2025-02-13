const express = require('express');
const router = express.Router();
const { Auction } = require('../../models/models/auction/auction.model');
const { v4: uuidv4 } = require('uuid');
const {User} = require("../../models/models/user/user.model");
const {Product} = require("../../models/models/product/product.model");

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

        const auctions = [
            {
                initial_price: 1000,
                actual_price: 1500,
                start_date: new Date('2025-02-10T10:00:00Z'),
                end_date: new Date('2025-02-12T10:00:00Z'),
                id_product: products[0].id_product,
                id_user: users[0].id_user
            },
            {
                initial_price: 500,
                actual_price: 750,
                start_date: new Date('2025-02-11T12:00:00Z'),
                end_date: new Date('2025-02-14T12:00:00Z'),
                id_product: products[1].id_product,
                id_user: users[1].id_user
            },
            {
                initial_price: 2000,
                actual_price: 2500,
                start_date: new Date('2025-02-13T15:00:00Z'),
                end_date: new Date('2025-02-20T15:00:00Z'),
                id_product: products[2].id_product,
                id_user: users[2].id_user
            },
        ];

        for (let auction of auctions) {
            await Auction.create({
                id_auction: uuidv4(),
                initial_price: auction.initial_price,
                actual_price: auction.actual_price,
                start_date: auction.start_date,
                end_date: auction.end_date,
                id_product: auction.id_product,
                id_user: auction.id_user
            });
            console.log(`Auction was added successfully ${auction.initial_price}`);
        }

        const allAuctions = await Auction.findAll();

        res.status(200).send(allAuctions);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of auction', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const auctions = await Auction.findAll();
        res.status(200).send(auctions);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of all auctions', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
