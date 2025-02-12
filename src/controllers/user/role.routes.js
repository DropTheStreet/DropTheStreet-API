const express = require('express');
const router = express.Router();
const { Role } = require('../../models/models/user/role.model');
const {DataTypes} = require("sequelize");

router.post('/seeder', async (req, res) => {
    try {
        const rolesToCreate = [
            { name: 'Admin' },
            { name: 'User' },
            { name: 'Seller' }
        ];

        for (let role of rolesToCreate) {
            const existingRole = await Role.findOne({ where: { name: role.name } });
            if (existingRole) {
                console.log(`Role "${role.name}" already exist`);
            } else {
                await Role.create({
                    name: role.name,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                console.log(`Role "${role.name}" was created successfully.`);
            }
        }

        const roles = await Role.findAll({
            order: [['name', 'ASC']],
        });

        res.status(200).send(roles);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during roles creation', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const roles = await Role.findAll({
            order: [['name', 'ASC']],
        });
        res.status(200).send(roles);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of roles', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
