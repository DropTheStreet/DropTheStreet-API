const express = require('express');
const router = express.Router();
const { Badge } = require('../../models/models/gamification/badge.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Badges à ajouter
        const badgesToCreate = [
            {
                name: 'Badge de Débutant',
                description: 'Récompense pour les nouveaux utilisateurs.',
                image: null,  // image BLOB vide, à remplacer si nécessaire
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
            }
        ];

        // Création des badges
        for (let badge of badgesToCreate) {
            await Badge.create({
                id_badge: uuidv4(),
                name: badge.name,
                description: badge.description,
                image: badge.image,
                createdAt: new Date(),  // Date de création
                updatedAt: new Date(),  // Date de mise à jour
            });
            console.log(`Badge ajouté: ${badge.name}`);
        }

        // Récupérer tous les badges pour renvoyer la réponse
        const badges = await Badge.findAll();

        // Retourner la liste des badges
        res.status(200).send(badges);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des badges', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const badges = await Badge.findAll();
        res.status(200).send(badges);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des badges', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
