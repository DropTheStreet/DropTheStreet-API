const express = require('express');
const router = express.Router();
const { Notification } = require('../../models/models/notification/notification.model');
const { v4: uuidv4 } = require('uuid');
const {Image} = require("../../models/models/product/image.model");
const {NotificationType} = require("../../models/models/notification/notification_type.model");
const {User} = require("../../models/models/user/user.model");

router.post('/seeder', async (req, res) => {
    try {
        const types = await NotificationType.findAll();
        if (types.length < 4) {
            return res.status(400).send({ message: 'Not enough types for seeding' });
        }
        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }
        const notificationsToCreate = [
            {
                content: 'Votre commande a été expédiée',
                is_read: false,
                id_notification_type: types[0].id_notification_type,
                id_user: users[0].id_user
            },
            {
                content: 'Nouveau message de support',
                is_read: false,
                id_notification_type: types[1].id_notification_type,
                id_user: users[0].id_user
            },
            {
                content: 'Promotion sur vos produits favoris',
                is_read: true,
                id_notification_type: types[2].id_notification_type ,
                id_user: users[1].id_user
            },
            {
                content: 'Votre paiement a été effectué avec succès',
                is_read: true,
                id_notification_type: types[3].id_notification_type,
                id_user: users[2].id_user
            },
        ];

        for (let notif of notificationsToCreate) {
            await Notification.create({
                content: notif.content,
                is_read: notif.is_read,
                id_notification_type: notif.id_notification_type,
                id_user: notif.id_user,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Notification added : ${notif.content}`);
        }

        const notifications = await Notification.findAll();

        res.status(200).send(notifications);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during added of notification', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.findAll();
        res.status(200).send(notifications);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of notifications', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
