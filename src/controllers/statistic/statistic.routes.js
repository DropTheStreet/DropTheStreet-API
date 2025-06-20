const express = require('express');
const router = express.Router();
const { Statistic } = require('../../models/models/statistic/statistic.model');
const {Product} = require("../../models/models/product/product.model");
const {User} = require("../../models/models/user/user.model");
const {Drop} = require("../../models/models/drop/drop.model");
const {Auction} = require("../../models/models/auction/auction.model");
const {Role} = require("../../models/models/user/role.model");
const StatisticRepository = require("../../models/repositories/statistic/statistic-repository");

router.post('/seeder', async (req, res) => {
    try {
        const products = await Product.findAll();
        const drops = await Drop.findAll();
        const auctions = await Auction.findAll();

        const sellerRole = await Role.findOne({ where: { name: 'Seller' } });

        if (!sellerRole) {
            return res.status(404).send({ message: 'Le rôle Vendor est introuvable.' });
        }

        const seller = await User.findOne({ where: { id_role: sellerRole.id_role } });

        if (!seller) {
            return res.status(404).send({ message: 'Aucun utilisateur Seller trouvé.' });
        }

        const statisticToCreate = [
            {
                sold_quantity: 20,
                id_vendor: seller.id_user,
                id_product: products[0].id_product,
                id_drop: drops.length > 0 ? drops[0].id_drop : null,
            },
            {
                sold_quantity: 7,
                id_vendor: seller.id_user,
                id_product: products[1].id_product,
                id_auction: auctions.length > 0 ? auctions[0].id_auction : null,
            },
            {
                sold_quantity: 15,
                id_vendor: seller.id_user,
                id_product: products[2].id_product,
                id_drop: drops.length > 1 ? drops[1].id_drop : null,
            },
            {
                sold_quantity: 5,
                id_vendor: seller.id_user,
                id_product: products[1].id_product,
                id_auction: auctions.length > 0 ? auctions[1].id_auction : null,
            },
            {
                sold_quantity: 52,
                id_vendor: seller.id_user,
                id_product: products[2].id_product,
                id_drop: drops.length > 1 ? drops[2].id_drop : null,
            }
        ];

        const createdStatistic = [];

        for (let stat of statisticToCreate) {
            const created = await Statistic.create({
                ...stat,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Statistic created with product ${stat.id_product}`);
            createdStatistic.push(created);
        }

        res.status(200).send(createdStatistic);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during seeding statistic', error: e.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const statistics = await Statistic.findAll({
            order: [['sold_quantity', 'ASC']],
        });
        res.status(200).send(statistics);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of getting statistics', error: e.message });
    }
});

router.get('/:id_vendor', async (req, res) => {
    try {
        const { id_vendor } = req.params;
        const items = await StatisticRepository.findStatisticBySellerId(id_vendor);
        res.status(200).json(items);
    } catch (e) {
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques par vendeur', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
