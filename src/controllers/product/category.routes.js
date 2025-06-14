const express = require('express');
const router = express.Router();
const { Category } = require('../../models/models/product/category.model');
const { v4: uuidv4 } = require('uuid');

router.post('/seeder', async (req, res) => {
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
            console.log(`Creation og category : ${cat.name}`);
        }

        const categories = await Category.findAll();

        res.status(200).send(categories);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during creation of category', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).send(categories);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of categories', error: e.message });
    }
});

// Créer une nouvelle marque
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).send({ message: 'Category name is required' });
        }

        // Vérifier si la marque existe déjà
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(200).send(existingCategory); // Retourner la marque existante
        }

        // Créer une nouvelle marque
        const newCategory = await Category.create({
            name,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).send(newCategory);
    } catch (e) {
        console.error('Error creating Category:', e);
        res.status(500).send({ message: 'Error creating Category', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
