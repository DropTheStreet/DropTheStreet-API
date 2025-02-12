const express = require('express');
const router = express.Router();
const { Image } = require('../../models/models/product/image.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Images de test (simulées avec des buffers vides ici)
        const imagesToCreate = [
            {
                image: Buffer.from('') // Ajouter une vraie image sous forme de buffer
            },
            {
                image: Buffer.from('')
            },
            {
                image: Buffer.from('')
            }
        ];

        for (let img of imagesToCreate) {
            await Image.create({
                id_image: uuidv4(),
                image: img.image,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Image ajoutée avec succès.`);
        }

        const images = await Image.findAll();

        res.status(200).send(images);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des images', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const images = await Image.findAll();
        res.status(200).send(images);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des images', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
