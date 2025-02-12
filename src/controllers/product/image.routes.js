const express = require('express');
const router = express.Router();
const { Image } = require('../../models/models/product/image.model');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

router.post('/seeder', async (req, res) => {
    try {
        const imagePaths = [
            path.join('C:', 'Users', 'eliza', 'Pictures', 'Screenshots', 'image1_seeder.png'),
            path.join('C:', 'Users', 'eliza', 'Pictures', 'Screenshots', 'image2_seeder.png'),
            path.join('C:', 'Users', 'eliza', 'Pictures', 'Screenshots', 'image3_seeder.png')
        ];

        const imagesToCreate = imagePaths.map(imagePath => {
            return {
                image: fs.readFileSync(imagePath)
            };
        });

        for (let img of imagesToCreate) {
            await Image.create({
                id_image: uuidv4(),
                image: img.image,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Image added successfully`);
        }

        const images = await Image.findAll();

        res.status(200).send(images);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during creating of image', error: e.message });
    }
});


router.get('/', async (req, res) => {
    try {
        const images = await Image.findAll();
        res.status(200).send(images);
    } catch (e) {
        res.status(500).send({ message: 'Error during creating of images', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
