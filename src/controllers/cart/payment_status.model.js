const express = require('express');
const router = express.Router();
const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Liste des statuts de paiement à ajouter
        const paymentStatuses = [
            {
                name: 'Pending',
            },
            {
                name: 'Completed',
            },
            {
                name: 'Failed',
            },
            {
                name: 'Refunded',
            },
        ];

        // Création des statuts de paiement
        for (let status of paymentStatuses) {
            await PaymentStatus.create({
                id_payment_status: uuidv4(),
                name: status.name,
                createdAt: new Date(),  // Date de création
                updatedAt: new Date(),  // Date de mise à jour
            });
            console.log(`Statut de paiement ajouté : ${status.name}`);
        }

        // Récupérer tous les statuts de paiement
        const statuses = await PaymentStatus.findAll();

        // Retourner la liste des statuts
        res.status(200).send(statuses);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des statuts de paiement', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const statuses = await PaymentStatus.findAll();
        res.status(200).send(statuses);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des statuts de paiement', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
