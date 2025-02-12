const express = require('express');
const router = express.Router();
const { Notification } = require('../../models/models/notification/notification.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Notifications de test
        const notificationsToCreate = [
            { content: 'Votre commande a été expédiée', is_read: false },
            { content: 'Nouveau message de support', is_read: false },
            { content: 'Promotion sur vos produits favoris', is_read: true },
            { content: 'Votre paiement a été effectué avec succès', is_read: true },
        ];

        for (let notif of notificationsToCreate) {
            await Notification.create({
                id_notification: uuidv4(),
                content: notif.content,
                is_read: notif.is_read,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Notification ajoutée : ${notif.content}`);
        }

        const notifications = await Notification.findAll();

        res.status(200).send(notifications);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des notifications', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.findAll();
        res.status(200).send(notifications);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des notifications', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
