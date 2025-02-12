const express = require('express');
const router = express.Router();
const { UserBadge } = require('../../models/models/gamification/user_badge.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Badges à ajouter avec la date d'obtention
        const badgesToCreate = [
            { obtaining_date: new Date('2025-01-15') },
            { obtaining_date: new Date('2025-02-10') },
            { obtaining_date: new Date('2025-03-05') },
            { obtaining_date: new Date('2025-04-20') },
        ];

        // Création des badges utilisateur
        for (let badge of badgesToCreate) {
            await UserBadge.create({
                id_user_badge: uuidv4(),
                obtaining_date: badge.obtaining_date,
                createdAt: new Date(),  // Utilisation de createdAt pour enregistrer la date
                updatedAt: new Date(),
            });
            console.log(`Badge utilisateur ajouté avec la date d'obtention : ${badge.obtaining_date}`);
        }

        // Récupérer tous les badges utilisateurs
        const userBadges = await UserBadge.findAll();

        // Retourner la réponse
        res.status(200).send(userBadges);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des badges utilisateur', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const userBadges = await UserBadge.findAll();
        res.status(200).send(userBadges);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des badges utilisateur', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
