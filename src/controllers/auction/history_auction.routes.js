const express = require('express');
const router = express.Router();
const { HistoryAuction } = require('../../models/models/auction/history_auction.model');
const { v4: uuidv4 } = require('uuid');
const {User} = require("../../models/models/user/user.model");
const {Auction} = require("../../models/models/auction/auction.model");

router.post('/seeder', async (req, res) => {
    try {
        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const auction = await Auction.findAll();
        if (auction.length < 3) {
            return res.status(400).send({ message: 'Not enough auctions for seeding' });
        }
        const auctions = [
            {
                amount: 250,
                createdAt: new Date(),
                id_user:users[0].id_user,
                id_auction: auction[0].id_auction
            },
            {
                amount: 500,
                createdAt: new Date(),
                id_user:users[1].id_user,
                id_auction: auction[1].id_auction
            },
            {
                amount: 1000,
                createdAt: new Date(),
                id_user:users[2].id_user,
                id_auction: auction[2].id_auction
            },
        ];

        for (let auction of auctions) {
            await HistoryAuction.create({
                amount: auction.amount,
                createdAt: auction.createdAt,
                id_user: auction.id_user,
                id_auction: auction.id_auction
            });
            console.log(`History auction was added ${auction.amount}`);
        }

        const allAuctions = await HistoryAuction.findAll();

        res.status(200).send(allAuctions);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of history auctions', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const auctions = await HistoryAuction.findAll();
        res.status(200).send(auctions);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of all history auctions', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
