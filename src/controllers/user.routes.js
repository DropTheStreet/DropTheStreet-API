const express = require('express');
const router = express.Router();
const userRepository = require('../models/repositories/user-repository');
const { User } = require("../models/models/user.model");

router.get('/seeder', async (req, res) => {
    try {
        await userRepository.createUser({
            pseudo: 'adrien',
            email: 'adriencompare@gmail.com',
            password: 'password',
        });

        await userRepository.createUser({
            pseudo: 'eliza',
            email: 'elizavetaice123@gmail.com',
            password: 'password',
        });
        const users = await User.findAll();

        res.status(200).send(users)
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/', async (req, res) => {
    res.send(await userRepository.getUsers());
});

exports.initializeRoutes = () => router;