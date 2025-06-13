const express = require('express');
const router = express.Router();
const { Category } = require('../../models/models/product/category.model');

// Récupérer toutes les catégories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['name', 'ASC']]
        });
        res.status(200).send(categories);
    } catch (e) {
        console.error('Error fetching categories:', e);
        res.status(500).send({ message: 'Error fetching categories', error: e.message });
    }
});

// Créer une nouvelle catégorie
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).send({ message: 'Category name is required' });
        }
        
        // Vérifier si la catégorie existe déjà
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(200).send(existingCategory); // Retourner la catégorie existante
        }
        
        // Créer une nouvelle catégorie
        const newCategory = await Category.create({
            name,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        res.status(201).send(newCategory);
    } catch (e) {
        console.error('Error creating category:', e);
        res.status(500).send({ message: 'Error creating category', error: e.message });
    }
});

// Récupérer une catégorie par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        
        if (!category) {
            return res.status(404).send({ message: 'Category not found' });
        }
        
        res.status(200).send(category);
    } catch (e) {
        console.error('Error fetching category:', e);
        res.status(500).send({ message: 'Error fetching category', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
