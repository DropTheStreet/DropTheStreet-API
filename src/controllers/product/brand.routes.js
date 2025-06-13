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

// Créer une nouvelle marque
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).send({ message: 'Brand name is required' });
        }

        // Vérifier si la marque existe déjà
        const existingBrand = await Brand.findOne({ where: { name } });
        if (existingBrand) {
            return res.status(200).send(existingBrand); // Retourner la marque existante
        }

        // Créer une nouvelle marque
        const newBrand = await Brand.create({
            name,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).send(newBrand);
    } catch (e) {
        console.error('Error creating brand:', e);
        res.status(500).send({ message: 'Error creating brand', error: e.message });
    }
});

// Récupérer une marque par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await Brand.findByPk(id);

        if (!brand) {
            return res.status(404).send({ message: 'Brand not found' });
        }

        res.status(200).send(brand);
    } catch (e) {
        console.error('Error fetching brand:', e);
        res.status(500).send({ message: 'Error fetching brand', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
