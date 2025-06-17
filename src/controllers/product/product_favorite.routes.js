const express = require('express');
const router = express.Router();
const { ProductFavorite } = require('../../models/models/product/product_favorite.model');
const ProductFavoriteRepository = require('../../models/repositories/product/product_favorite-repository');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../../models/models/user/user.model');
const { Product } = require('../../models/models/product/product.model');

router.post('/seeder', async (req, res) => {
    try {
        const users = await User.findAll();
        const products = await Product.findAll();

        if (users.length < 3 || products.length < 3) {
            return res.status(400).send({ message: 'Not enough users or products for seeding' });
        }

        const favoritesToCreate = [
            { id_user: users[0].id_user, id_product: products[0].id_product },
            { id_user: users[1].id_user, id_product: products[1].id_product },
            { id_user: users[2].id_user, id_product: products[2].id_product }
        ];

        for (let favorite of favoritesToCreate) {
            const existingFavorite = await ProductFavorite.findOne({
                where: { id_user: favorite.id_user, id_product: favorite.id_product }
            });

            if (!existingFavorite) {
                await ProductFavorite.create({
                    id_product_favorite: uuidv4(),
                    id_user: favorite.id_user,
                    id_product: favorite.id_product,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        const favorites = await ProductFavorite.findAll({ order: [['id_user', 'ASC']] });
        res.status(200).send(favorites);
    } catch (e) {
        res.status(500).send({ message: 'Error during adding of favorites', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const favorites = await ProductFavoriteRepository.findAll();
        res.status(200).send(favorites);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of favorites', error: e.message });
    }
});

// AJOUTER UN FAVORI (avec doublon check)
router.post('/add', async (req, res) => {
    const { id_user, id_product } = req.body;
    try {
        const favorite = await ProductFavoriteRepository.addToFavorites(id_user, id_product);
        res.status(201).json(favorite);
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

// SUPPRIMER UN FAVORI PAR ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const favorite = await ProductFavoriteRepository.findById(id);
        if (!favorite) {
            return res.status(404).json({ message: 'Favori introuvable' });
        }
        await favorite.destroy();
        res.status(200).json({ message: 'Favori supprimé avec succès' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// SUPPRIMER UN FAVORI PAR user + product
router.delete('/', async (req, res) => {
    const { id_user, id_product } = req.body;
    try {
        await ProductFavoriteRepository.removeFromFavorites(id_user, id_product);
        res.status(200).json({ message: 'Favori supprimé avec succès' });
    } catch (e) {
        res.status(404).json({ message: e.message });
    }
});

// FAVORIS D’UN UTILISATEUR AVEC DÉTAILS
router.get('/user/:id_user', async (req, res) => {
    const { id_user } = req.params;
    try {
        const favorites = await ProductFavoriteRepository.findByUserId(id_user);
        res.status(200).json(favorites);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// VÉRIFIER SI PRODUIT EST EN FAVORI
router.get('/user/:id_user/product/:id_product', async (req, res) => {
    const { id_user, id_product } = req.params;
    try {
        const favorite = await ProductFavoriteRepository.findByUserAndProduct(id_user, id_product);
        if (!favorite) {
            return res.status(404).json({ message: 'Produit non présent dans les favoris' });
        }
        res.status(200).json(favorite);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// DÉTAIL D’UN FAVORI PAR ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const favorite = await ProductFavoriteRepository.findByIdWithDetails(id);
        if (!favorite) {
            return res.status(404).json({ message: 'Favori introuvable' });
        }
        res.status(200).json(favorite);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
