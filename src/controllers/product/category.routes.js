const express = require('express');
const router = express.Router();
const { Category } = require('../../models/models/product/category.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Catégories de test
        const categoriesToCreate = [
            { name: 'Électronique' },
            { name: 'Vêtements' },
            { name: 'Accessoires' },
            { name: 'Alimentation' },
            { name: 'Livres' }
        ];

        for (let cat of categoriesToCreate) {
            await Category.create({
                id_category: uuidv4(),
                name: cat.name,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Catégorie ajoutée : ${cat.name}`);
        }

        const categories = await Category.findAll();

        res.status(200).send(categories);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des catégories', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).send(categories);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des catégories', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
