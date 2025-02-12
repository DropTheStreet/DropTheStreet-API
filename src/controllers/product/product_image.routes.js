const express = require('express');
const router = express.Router();
const { ProductImage } = require('../../models/models/product/product_image.model');
const { v4: uuidv4 } = require('uuid');
const {User} = require("../../models/models/user/user.model");
const {Product} = require("../../models/models/product/product.model");
const {Image} = require("../../models/models/product/image.model");

router.post('/seeder', async (req, res) => {
    try {
        const images = await Image.findAll();
        if (images.length < 3) {
            return res.status(400).send({ message: 'Not enough images for seeding' });
        }
        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }
        const productImagesToCreate = [
            { id_image: images[0].id_image, id_product: products[0].id_product },
            { id_image: images[1].id_image, id_product: products[1].id_product },
            { id_image: images[2].id_image, id_product: products[2].id_product }
        ];

        for (let productImage of productImagesToCreate) {
            const existingImage = await ProductImage.findOne({
                where: { id_image: productImage.id_image, id_product: productImage.id_product }
            });

            if (existingImage) {
                console.log(`This image product already existe`);
            } else {
                await ProductImage.create({
                    id_product_image: uuidv4(),
                    id_image: productImage.id_image,
                    id_product: productImage.id_product,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Image was associated successfully`);
            }
        }

        const productImages = await ProductImage.findAll({ order: [['id_product', 'ASC']] });

        res.status(200).send(productImages);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during association of image to product', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const productImages = await ProductImage.findAll({ order: [['id_product', 'ASC']] });
        res.status(200).send(productImages);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of image products', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};