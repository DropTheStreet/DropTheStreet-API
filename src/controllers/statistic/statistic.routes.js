const express = require('express');
const router = express.Router();
const { Statistic } = require('../../models/models/statistic/statistic.model');

router.get('/seeder', async (req, res) => {
    try {
        const statisticsToCreate = [
            { sold_quantity: 150, income: 3000 },
            { sold_quantity: 200, income: 4000 },
            { sold_quantity: 500, income: 10000 }
        ];

        for (let stat of statisticsToCreate) {
            const existingStat = await Statistic.findOne({ where: { sold_quantity: stat.sold_quantity, income: stat.income } });
            if (existingStat) {
                console.log(`La statistique avec la quantité vendue "${stat.sold_quantity}" existe déjà. Ignorer la création.`);
            } else {
                await Statistic.create({
                    sold_quantity: stat.sold_quantity,
                    income: stat.income,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Statistique avec la quantité vendue "${stat.sold_quantity}" créée avec succès.`);
            }
        }

        const statistics = await Statistic.findAll({
            order: [['sold_quantity', 'ASC']],
        });

        res.status(200).send(statistics);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de la création des statistiques', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const statistics = await Statistic.findAll({
            order: [['sold_quantity', 'ASC']],
        });
        res.status(200).send(statistics);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des statistiques', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
