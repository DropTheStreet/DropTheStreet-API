const express = require('express');
const router = express.Router();
const { Product } = require('../../models/models/product/product.model');
const { v4: uuidv4 } = require('uuid');
const {Category} = require("../../models/models/product/category.model");

router.post('/seeder', async (req, res) => {
    try {
        const categories = await Category.findAll();
        if (categories.length < 3) {
            return res.status(400).send({ message: 'Not enough categories for seeding' });
        }

        const productsToCreate = [
            {
                name: 'Produit 1',
                description: 'Description du produit 1',
                price: 19.99,
                image: null,
                quantity: 100,
                id_category: categories[0].id_category,
            },
            {
                name: 'Produit 2',
                description: 'Description du produit 2',
                price: 29.99,
                image: null,
                quantity: 50,
                id_category: categories[1].id_category,
            },
            {
                name: 'Produit 3',
                description: 'Description du produit 3',
                price: 39.99,
                image: null,
                quantity: 200,
                id_category: categories[2].id_category,
            }
        ];

        for (let product of productsToCreate) {
            await Product.create({
                id_product_favorite: uuidv4(),
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image,
                quantity: product.quantity,
                id_category: product.id_category,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Produit "${product.name}" ajouté avec succès.`);
        }

        const products = await Product.findAll({ order: [['name', 'ASC']] });

        res.status(200).send(products);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des produits', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const products = await Product.findAll({ order: [['name', 'ASC']] });
        res.status(200).send(products);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des produits', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
