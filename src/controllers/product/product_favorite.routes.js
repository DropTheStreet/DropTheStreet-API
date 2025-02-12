const express = require('express');
const router = express.Router();
const { ProductFavorite } = require('../../models/models/product/product_favorite.model');
const { v4: uuidv4 } = require('uuid');
const {Category} = require("../../models/models/product/category.model");
const {User} = require("../../models/models/user/user.model");
const {Product} = require("../../models/models/product/product.model");

router.post('/seeder', async (req, res) => {
    try {
        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }
        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
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

            if (existingFavorite) {
                console.log(`This product is already in favorites`);
            } else {
                await ProductFavorite.create({
                    id_product_favorite: uuidv4(),
                    id_user: favorite.id_user,
                    id_product: favorite.id_product,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Product was added to favorites wit success`);
            }
        }

        const favorites = await ProductFavorite.findAll({ order: [['id_user', 'ASC']] });

        res.status(200).send(favorites);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of favorites', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const favorites = await ProductFavorite.findAll({ order: [['id_user', 'ASC']] });
        res.status(200).send(favorites);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of favorites', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};