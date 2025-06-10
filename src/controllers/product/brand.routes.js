const express = require('express');
const router = express.Router();
const { Brand } = require('../../models/models/product/brand.model');
const { v4: uuidv4 } = require('uuid');

router.post('/seeder', async (req, res) => {
    try {
        // Catégories de test
        const categoriesToCreate = [
            { name: 'Nike' },
            { name: 'Adidas' },
            { name: 'New Balance' },
        ];

        for (let cat of categoriesToCreate) {
            await Brand.create({
                id_brand: uuidv4(),
                name: cat.name,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Creation og brand : ${cat.name}`);
        }

        const categories = await Brand.findAll();

        res.status(200).send(categories);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during creation of brand', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const categories = await Brand.findAll();
        res.status(200).send(categories);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of brands', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
