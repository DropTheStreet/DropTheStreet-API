const express = require('express');
const router = express.Router();

router.post('/seeder', async (req, res) => {
    try {
        const roleSeederResponse = await fetch('http://localhost:3000/role/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!roleSeederResponse.ok) {
            throw new Error('Erreur lors de l\'exécution du seeder des rôles');
        }

        console.log('✅ Roles Seeder exécuté avec succès');

        const userSeederResponse = await fetch('http://localhost:3000/user/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!userSeederResponse.ok) {
            throw new Error('Erreur lors de l\'exécution du seeder des utilisateurs');
        }

        console.log('✅ Users Seeder exécuté avec succès');

        // Si tout s'est bien passé
        res.status(200).send({ message: 'Tous les seeders ont été exécutés avec succès!' });

    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution des seeders:', error);
        res.status(500).send({ message: 'Erreur lors de l\'exécution des seeders', error: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router
};
