const express = require('express');
const router = express.Router();
const { ProductImage } = require('../../models/models/product/product_image.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        const productImagesToCreate = [
            { id_image: uuidv4(), id_product: uuidv4() },
            { id_image: uuidv4(), id_product: uuidv4() },
            { id_image: uuidv4(), id_product: uuidv4() }
        ];

        for (let productImage of productImagesToCreate) {
            const existingImage = await ProductImage.findOne({
                where: { id_image: productImage.id_image, id_product: productImage.id_product }
            });

            if (existingImage) {
                console.log(`L'association image-produit existe déjà. Ignoré.`);
            } else {
                await ProductImage.create({
                    id_product_image: uuidv4(),
                    id_image: productImage.id_image,
                    id_product: productImage.id_product,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Image associée au produit avec succès.`);
            }
        }

        const productImages = await ProductImage.findAll({ order: [['id_product', 'ASC']] });

        res.status(200).send(productImages);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de la création des associations image-produit', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const productImages = await ProductImage.findAll({ order: [['id_product', 'ASC']] });
        res.status(200).send(productImages);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des images de produits', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};