const express = require('express');
const router = express.Router();
const { Drop } = require('../../models/models/drop/drop.model');
const { v4: uuidv4 } = require('uuid');
const {Product} = require("../../models/models/product/product.model");
const DropRepository = require("../../models/repositories/drop/drop-repository");
router.post('/seeder', async (req, res) => {
    try {
        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }
        const dropsToCreate = [
            {
                start_date: new Date('2025-02-15T00:00:00Z'),
                end_date: new Date('2025-02-22T23:59:59Z'),
                is_premium: false,
                id_product: products[0].id_product
            },
            {
                start_date: new Date('2025-03-01T00:00:00Z'),
                end_date: new Date('2025-03-07T23:59:59Z'),
                is_premium: true,
                id_product: products[1].id_product
            },
            {
                start_date: new Date('2025-04-10T00:00:00Z'),
                end_date: new Date('2025-04-17T23:59:59Z'),
                is_premium: false,
                id_product: products[2].id_product
            },
            {
                start_date: new Date('2025-05-10T00:00:00Z'),
                end_date: new Date('2025-06-17T23:59:59Z'),
                is_premium: false,
                id_product: products[2].id_product
            }
        ];

        for (let drop of dropsToCreate) {
            await Drop.create({
                start_date: drop.start_date,
                end_date: drop.end_date,
                is_premium: drop.is_premium,
                id_product: drop.id_product,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Drop was created successfully: ${drop.start_date} - ${drop.end_date}`);
        }

        const drops = await Drop.findAll();

        res.status(200).send(drops);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding a drop', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const drops = await Drop.findAll();
        res.status(200).send(drops);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting a drop', error: e.message });
    }
});

router.get('/next', async (req, res) => {
    try {
        const drop = await DropRepository.findUpcomingDropWithProduct();

        if (!drop) {
            return res.status(404).json({ message: 'No upcoming drop found' });
        }
        res.status(200).json(drop);
    } catch (e) {
        console.error('Error fetching next drop:', e);
        res.status(500).json({
            message: 'Error while getting the next drop',
            error: e.message
        });
    }
});


module.exports = {
    initializeRoutes: () => router,
};
