const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { User } = require('../../models/models/user/user.model');

router.get('/seeder', async (req, res) => {
    try {
        const usersToCreate = [
            {
                pseudo: 'adrien',
                email: 'adriencompare@gmail.com',
                password: 'password',
                bio: 'Bio d\'Adrien',
                dropcoins: 100,
                id_role: 'role-uuid-example',
            },
            {
                pseudo: 'eliza',
                email: 'elizavetaice123@gmail.com',
                password: 'password',
                bio: 'Bio d\'Eliza',
                dropcoins: 200,
                id_role: 'role-uuid-example',
            }
        ];

        const hashedUsers = await Promise.all(usersToCreate.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return {
                ...user,
                password: hashedPassword,
            };
        }));

        for (let user of hashedUsers) {
            const existingUser = await User.findOne({ where: { email: user.email } });
            if (existingUser) {
                console.log(`L'utilisateur ${user.email} existe déjà. Ignorer la création.`);
            } else {
                await User.create({
                    id_user: require('sequelize').UUIDV4(),
                    pseudo: user.pseudo,
                    email: user.email,
                    password: user.password,
                    bio: user.bio,
                    photo: null,
                    dropcoins: user.dropcoins,
                    id_role: user.id_role,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        const users = await User.findAll({
            order: [['pseudo', 'ASC']],
        });

        res.status(200).send(users);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de la création des utilisateurs', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['pseudo', 'ASC']],
        });
        res.status(200).send(users);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des utilisateurs', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};