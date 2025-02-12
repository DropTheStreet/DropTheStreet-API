const express = require('express');
const router = express.Router();
const { NotificationType } = require('../../models/models/notification/notification_type.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Types de notifications à créer
        const notificationTypesToCreate = [
            { name: 'Alerte de commande' },
            { name: 'Message de support' },
            { name: 'Promotion' },
            { name: 'Paiement' },
        ];

        for (let type of notificationTypesToCreate) {
            await NotificationType.create({
                id_notification_type: uuidv4(),
                name: type.name,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Type de notification ajouté : ${type.name}`);
        }

        const notificationTypes = await NotificationType.findAll();

        res.status(200).send(notificationTypes);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des types de notification', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const notificationTypes = await NotificationType.findAll();
        res.status(200).send(notificationTypes);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des types de notification', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
