const express = require('express');
const router = express.Router();
const { ProductFavorite } = require('../../models/models/product/product_favorite.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        const favoritesToCreate = [
            { id_user: uuidv4(), id_product: uuidv4() },
            { id_user: uuidv4(), id_product: uuidv4() },
            { id_user: uuidv4(), id_product: uuidv4() }
        ];

        for (let favorite of favoritesToCreate) {
            const existingFavorite = await ProductFavorite.findOne({
                where: { id_user: favorite.id_user, id_product: favorite.id_product }
            });

            if (existingFavorite) {
                console.log(`Le produit est déjà en favori pour cet utilisateur. Ignoré.`);
            } else {
                await ProductFavorite.create({
                    id_product_favorite: uuidv4(),
                    id_user: favorite.id_user,
                    id_product: favorite.id_product,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Produit ajouté aux favoris avec succès.`);
            }
        }

        const favorites = await ProductFavorite.findAll({ order: [['id_user', 'ASC']] });

        res.status(200).send(favorites);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des favoris', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const favorites = await ProductFavorite.findAll({ order: [['id_user', 'ASC']] });
        res.status(200).send(favorites);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des favoris', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};