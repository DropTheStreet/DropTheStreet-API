const express = require('express');
const router = express.Router();
const { Statistic } = require('../../models/models/statistic/statistic.model');

router.post('/seeder', async (req, res) => {
    try {
        const statisticsToCreate = [
            { sold_quantity: 150, income: 3000 },
            { sold_quantity: 200, income: 4000 },
            { sold_quantity: 500, income: 10000 }
        ];

        for (let stat of statisticsToCreate) {
            const existingStat = await Statistic.findOne({ where: { sold_quantity: stat.sold_quantity, income: stat.income } });
            if (existingStat) {
                console.log(`Statistic with sold quantity "${stat.sold_quantity}" already exist.`);
            } else {
                await Statistic.create({
                    sold_quantity: stat.sold_quantity,
                    income: stat.income,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Statistic with sold quantity  "${stat.sold_quantity}" was created successfully`);
            }
        }

        const statistics = await Statistic.findAll({
            order: [['sold_quantity', 'ASC']],
        });

        res.status(200).send(statistics);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during the statistic creation', error: e.message });
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

module.exports = {
    initializeRoutes: () => router,
};
