const express = require('express');
const router = express.Router();
const { Notification } = require('../../models/models/notification/notification.model');
const { v4: uuidv4 } = require('uuid');
const {Image} = require("../../models/models/product/image.model");
const {NotificationType} = require("../../models/models/notification/notification_type.model");
const {User} = require("../../models/models/user/user.model");
const NotificationRepository = require("../../models/repositories/notification/notification-repository");
const {Role} = require("../../models/models/user/role.model");

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
                id_user: users[0].id_user,
                sendAt: new Date(),
                is_sent: false
            },
            {
                content: 'Nouveau message de support',
                is_read: false,
                id_notification_type: types[1].id_notification_type,
                id_user: users[0].id_user,
                sendAt: new Date(),
                is_sent: false
            },
            {
                content: 'Promotion sur vos produits favoris',
                is_read: true,
                id_notification_type: types[2].id_notification_type ,
                id_user: users[1].id_user,
                sendAt: new Date(),
                is_sent: true
            },
            {
                content: 'Votre paiement a été effectué avec succès',
                is_read: true,
                id_notification_type: types[3].id_notification_type,
                id_user: users[2].id_user,
                sendAt: new Date(),
                is_sent: true
            },
        ];

        for (let notif of notificationsToCreate) {
            await Notification.create({
                content: notif.content,
                is_read: notif.is_read,
                id_notification_type: notif.id_notification_type,
                id_user: notif.id_user,
                is_sent: notif.is_sent,
                sendAt: notif.sendAt,
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

router.get('/:id_user', async (req, res) => {
    try {
        const { id_user } = req.params;

        if (!id_user) {
            return res.status(400).send({ message: 'User ID is required' });
        }

        const notifications = await NotificationRepository.findByUserId(id_user);

        if (!notifications || notifications.length === 0) {
            return res.status(404).send({ message: 'No notifications found for this user' });
        }

        res.status(200).send(notifications);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting notifications', error: e.message });
    }
});

router.post('/become-seller', async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).send({ message: 'Le champ content est requis et doit être une chaîne de caractères.' });
        }

        // Recherche du type de notification par son nom
        const notificationType = await NotificationType.findOne({
            where: { name: 'Message de support' }
        });

        if (!notificationType) {
            return res.status(404).send({ message: 'Type de notification "Message de support" non trouvé.' });
        }

        // Recherche du user admin (unique)
        const { Role } = require('../../models/models/user/role.model');
        const adminRole = await Role.findOne({ where: { name: 'Admin' } });

        if (!adminRole) {
            return res.status(404).send({ message: 'Le rôle Admin est introuvable.' });
        }

        const adminUser = await User.findOne({ where: { id_role: adminRole.id_role } });

        if (!adminUser) {
            return res.status(404).send({ message: 'Aucun utilisateur Admin trouvé.' });
        }

        // Création de la notification
        const newNotification = await NotificationRepository.create({
            content,
            is_read: false,
            id_notification_type: notificationType.id_notification_type,
            id_user: adminUser.id_user,
            is_sent: true,
            sendAt: new Date()
        });

        return res.status(201).send(newNotification);
    } catch (e) {
        console.error('Erreur lors de la création de la notification /become-seller:', e);
        res.status(500).send({ message: 'Erreur serveur lors de la création de la notification.', error: e.message });
    }
});

router.put('/:id/mark-read', async (req, res) => {
    try {
        const id_notification = req.params.id;

        const notification = await NotificationRepository.findById(id_notification);

        if (!notification) {
            return res.status(404).send({ message: 'Notification non trouvée.' });
        }

        notification.is_read = true;
        await notification.save();

        return res.status(200).send({ message: 'Notification marquée comme lue.', notification });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la notification:', error);
        res.status(500).send({ message: 'Erreur serveur lors de la mise à jour de la notification.', error: error.message });
    }
});


router.post('/drop', async (req, res) => {
    try {
        const { content, sendAt, id_user } = req.body;

        // Recherche du type de notification par son nom
        const notificationType = await NotificationType.findOne({
            where: { name: 'Drop' }
        });

        if (!notificationType) {
            return res.status(404).send({ message: 'Type de notification "Drop" non trouvé.' });
        }

        // Création de la notification
        const newNotification = await NotificationRepository.create({
            content,
            is_read: false,
            id_notification_type: notificationType.id_notification_type,
            id_user: id_user,
            is_sent: false,
            sendAt: sendAt
        });

        return res.status(201).send(newNotification);
    } catch (e) {
        console.error('Erreur lors de la création de la notification Auction:', e);
        res.status(500).send({ message: 'Erreur serveur lors de la création de la notification.', error: e.message });
    }
});

router.post('/auction', async (req, res) => {
    try {
        const { content, sendAt, id_user } = req.body;

        // Recherche du type de notification par son nom
        const notificationType = await NotificationType.findOne({
            where: { name: 'Auction' }
        });

        if (!notificationType) {
            return res.status(404).send({ message: 'Type de notification "Auction" non trouvé.' });
        }

        // Création de la notification
        const newNotification = await NotificationRepository.create({
            content,
            is_read: false,
            id_notification_type: notificationType.id_notification_type,
            id_user: id_user,
            is_sent: false,
            sendAt: sendAt
        });

        return res.status(201).send(newNotification);
    } catch (e) {
        console.error('Erreur lors de la création de la notification Auction:', e);
        res.status(500).send({ message: 'Erreur serveur lors de la création de la notification.', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
