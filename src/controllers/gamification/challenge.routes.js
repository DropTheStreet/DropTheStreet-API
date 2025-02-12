const express = require('express');
const router = express.Router();
const { Challenge } = require('../../models/models/gamification/challenge.model');
const { v4: uuidv4 } = require('uuid');

router.post('/seeder', async (req, res) => {
    try {
        const challengesToCreate = [
            {
                name: 'Défi de Lancement',
                description: 'Participe à notre premier défi et gagne des récompenses exclusives!',
                reward: 1000,
                is_actif: true
            },
            {
                name: 'Défi de Mois',
                description: 'Réussis toutes les tâches mensuelles et gagne une récompense.',
                reward: 500,
                is_actif: true
            },
            {
                name: 'Défi Spécial',
                description: 'Un défi exclusif pour nos utilisateurs les plus fidèles.',
                reward: 2000,
                is_actif: false
            }
        ];

        for (let challenge of challengesToCreate) {
            await Challenge.create({
                id_challenge: uuidv4(),
                name: challenge.name,
                description: challenge.description,
                reward: challenge.reward,
                is_actif: challenge.is_actif,
                createdAt: new Date(), // Date de création
                updatedAt: new Date(), // Date de mise à jour
            });
            console.log(`Challenge added successfully: ${challenge.name}`);
        }

        const challenges = await Challenge.findAll();

        res.status(200).send(challenges);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during creation of challenges', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const challenges = await Challenge.findAll();
        res.status(200).send(challenges);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of challenges', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
