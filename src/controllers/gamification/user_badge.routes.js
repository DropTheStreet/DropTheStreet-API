const express = require('express');
const router = express.Router();
const { UserBadge } = require('../../models/models/gamification/user_badge.model');
const { v4: uuidv4 } = require('uuid');
const {User} = require("../../models/models/user/user.model");
const {Badge} = require("../../models/models/gamification/badge.model");

router.post('/seeder', async (req, res) => {
    try {
        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const badges = await Badge.findAll();
        if (badges.length < 3) {
            return res.status(400).send({ message: 'Not enough badges for seeding' });
        }
        const badgesToCreate = [
            {
                id_user: users[0].id_user,
                id_badge: badges[0].id_badge
            },
            {
                id_user: users[1].id_user,
                id_badge: badges[1].id_badge
            },
            {
                id_user: users[1].id_user,
                id_badge: badges[1].id_badge
            }
        ];

        for (let badge of badgesToCreate) {
            await UserBadge.create({
                id_user: badge.id_user,
                id_badge: badge.id_badge,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Badge for user was created successfully : ${badge.id_user}`);
        }

        const userBadges = await UserBadge.findAll();

        res.status(200).send(userBadges);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of user badge', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const userBadges = await UserBadge.findAll();
        res.status(200).send(userBadges);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting user badges', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
