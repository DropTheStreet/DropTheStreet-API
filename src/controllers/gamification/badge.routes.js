const express = require('express');
const router = express.Router();
const { Badge } = require('../../models/models/gamification/badge.model');
const { v4: uuidv4 } = require('uuid');

router.post('/seeder', async (req, res) => {
    try {
        const badgesToCreate = [
            {
                name: 'DropStreeter débutant',
                description: 'Récompense pour les nouveaux utilisateurs.',
                image: null,
            },
            {
                name: 'Badge de Milestone',
                description: 'Récompense pour avoir atteint une étape importante.',
                image: null,
            },
            {
                name: 'Badge VIP',
                description: 'Récompense pour les utilisateurs les plus actifs.',
                image: null,
            },

            {
                name: 'Premier Enchérisseur',
                description: 'Félicitations pour votre première enchère gagnée et payée !',
                image: null,
            },
            {
                name: 'Enchérisseur Régulier',
                description: 'Vous avez gagné et payé 5 enchères. Votre passion est remarquable !',
                image: null,
            },
            {
                name: 'Enchérisseur Elite',
                description: 'Vous avez gagné et payé 10 enchères. Vous êtes un champion des enchères !',
                image: null,
            },

            // Badges pour les drops
            {
                name: 'Premier Drop',
                description: 'Félicitations pour votre premier achat de drop !',
                image: null,
            },
            {
                name: 'Collectionneur',
                description: 'Vous avez acheté 5 drops. Votre collection s\'agrandit !',
                image: null,
            },
            {
                name: 'Collectionneur Elite',
                description: 'Vous avez acheté 10 drops. Vous êtes un véritable collectionneur !',
                image: null,
            },

        ];

        for (let badge of badgesToCreate) {
            await Badge.create({
                id_badge: uuidv4(),
                name: badge.name,
                description: badge.description,
                image: badge.image,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Badge was added successfully: ${badge.name}`);
        }

        const badges = await Badge.findAll();

        res.status(200).send(badges);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of badge', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const badges = await Badge.findAll();
        res.status(200).send(badges);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of badges', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};