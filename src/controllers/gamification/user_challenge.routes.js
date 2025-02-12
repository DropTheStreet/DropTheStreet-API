const express = require('express');
const router = express.Router();
const { UserChallenge } = require('../../models/models/gamification/user_challenge.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Défis à créer
        const challengesToCreate = [
            { progression: 3, is_finished: false, end_date: new Date('2025-12-31') },
            { progression: 7, is_finished: false, end_date: new Date('2025-11-30') },
            { progression: 1, is_finished: false, end_date: new Date('2025-10-15') },
            { progression: 5, is_finished: true, end_date: new Date('2025-09-01') },
        ];

        for (let challenge of challengesToCreate) {
            await UserChallenge.create({
                id_user_challenge: uuidv4(),
                progression: challenge.progression,
                is_finished: challenge.is_finished,
                end_date: challenge.end_date,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Défi utilisateur ajouté : progression ${challenge.progression}%`);
        }

        const userChallenges = await UserChallenge.findAll();

        res.status(200).send(userChallenges);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des défis utilisateur', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const userChallenges = await UserChallenge.findAll();
        res.status(200).send(userChallenges);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des défis utilisateur', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
