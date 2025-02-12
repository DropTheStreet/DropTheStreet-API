const express = require('express');
const router = express.Router();
const { NotificationType } = require('../../models/models/notification/notification_type.model');
const { v4: uuidv4 } = require('uuid');

router.post('/seeder', async (req, res) => {
    try {

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
            console.log(`Type of notification was added : ${type.name}`);
        }

        const notificationTypes = await NotificationType.findAll();

        res.status(200).send(notificationTypes);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of type of notification', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const notificationTypes = await NotificationType.findAll();
        res.status(200).send(notificationTypes);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of types of notifications', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
