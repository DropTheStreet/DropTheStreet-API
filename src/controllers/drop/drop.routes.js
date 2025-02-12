const express = require('express');
const router = express.Router();
const { Drop } = require('../../models/models/drop/drop.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        const dropsToCreate = [
            {
                start_date: new Date('2025-02-15T00:00:00Z'), // Date de début
                end_date: new Date('2025-02-22T23:59:59Z'),   // Date de fin
                is_premium: false,
            },
            {
                start_date: new Date('2025-03-01T00:00:00Z'),
                end_date: new Date('2025-03-07T23:59:59Z'),
                is_premium: true,
            },
            {
                start_date: new Date('2025-04-10T00:00:00Z'),
                end_date: new Date('2025-04-17T23:59:59Z'),
                is_premium: false,
            }
        ];

        // Création des drops
        for (let drop of dropsToCreate) {
            await Drop.create({
                id_drop: uuidv4(),
                start_date: drop.start_date,
                end_date: drop.end_date,
                is_premium: drop.is_premium,
                createdAt: new Date(),  // Date de création
                updatedAt: new Date(),  // Date de mise à jour
            });
            console.log(`Drop ajouté avec succès: ${drop.start_date} - ${drop.end_date}`);
        }

        // Récupérer tous les drops pour renvoyer la réponse
        const drops = await Drop.findAll();

        // Retourner la liste des drops
        res.status(200).send(drops);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des drops', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const drops = await Drop.findAll();
        res.status(200).send(drops);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des drops', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
