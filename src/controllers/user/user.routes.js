const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { User } = require('../../models/models/user/user.model');
const {Role} = require("../../models/models/user/role.model");
const {loginUser} = require("../../models/repositories/user/user-repository");

router.get('/seeder', async (req, res) => {
    try {
        const roles = await Role.findAll();
        const roleMap = {};
        roles.forEach(role => {
            roleMap[role.name] = role.id_role;
        });

        const usersToCreate = [
            {
                pseudo: 'admin',
                email: 'admin@gmail.com',
                password: 'admin',
                bio: 'admin',
                dropcoins: 0,
                roleName: 'Admin',
            },
            {
                pseudo: 'user',
                email: 'user@gmail.com',
                password: 'user',
                bio: 'Bio d\'User',
                dropcoins: 100,
                roleName: 'User',
            },
            {
                pseudo: 'seller',
                email: 'seller@gmail.com',
                password: 'seller',
                bio: 'Bio de Seller',
                dropcoins: 200,
                roleName: 'Seller',
            }
        ];

        const hashedUsers = await Promise.all(usersToCreate.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return {
                ...user,
                password: hashedPassword,
                id_role: roleMap[user.roleName],
            };
        }));

        for (let user of hashedUsers) {
            const existingUser = await User.findOne({ where: { email: user.email } });
            if (existingUser) {
                console.log(`User ${user.email} already exists. Skipping creation.`);
            } else {
                await User.create({
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
                console.log(`User ${user.email} created successfully.`);
            }
        }

        const users = await User.findAll({
            order: [['pseudo', 'ASC']],
        });

        res.status(200).send(users);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error creating users', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['pseudo', 'ASC']],
        });
        res.status(200).send(users);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of users', error: e.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const { token, user } = await loginUser(email, password);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id_user: user.id_user,
                pseudo: user.pseudo,
                email: user.email,
                bio: user.bio,
                dropcoins: user.dropcoins,
                id_role: user.id_role
            }
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

module.exports = {
    initializeRoutes: () => router,
};