const express = require('express');
const router = express.Router();
const { Role } = require('../../models/models/user/role.model');

router.get('/seeder', async (req, res) => {
    try {
        const rolesToCreate = [
            { name: 'Admin' },
            { name: 'User' },
            { name: 'Moderator' }
        ];

        for (let role of rolesToCreate) {
            const existingRole = await Role.findOne({ where: { name: role.name } });
            if (existingRole) {
                console.log(`Le rôle "${role.name}" existe déjà. Ignorer la création.`);
            } else {
                await Role.create({
                    id_role: require('sequelize').UUIDV4(),
                    name: role.name,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Rôle "${role.name}" créé avec succès.`);
            }
        }

        const roles = await Role.findAll({
            order: [['name', 'ASC']],
        });

        res.status(200).send(roles);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de la création des rôles', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const roles = await Role.findAll({
            order: [['name', 'ASC']],
        });
        res.status(200).send(roles);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des rôles', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
