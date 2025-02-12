const express = require('express');
const router = express.Router();
const { HistoryAuction } = require('../../models/models/auction/history_auction.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Liste des enchères fictives à ajouter
        const auctions = [
            {
                amount: 250, // Montant de l'enchère
                createdAt: new Date(), // Date de l'enchère
            },
            {
                amount: 500,
                createdAt: new Date(),
            },
            {
                amount: 1000,
                createdAt: new Date(),
            },
        ];

        // Création des enchères
        for (let auction of auctions) {
            await HistoryAuction.create({
                id_history_auction: uuidv4(),
                amount: auction.amount,
                createdAt: auction.createdAt, // Ajout de la date de création
            });
            console.log(`Enchère ajoutée avec un montant de ${auction.amount}`);
        }

        // Récupérer toutes les enchères
        const allAuctions = await HistoryAuction.findAll();

        // Retourner la liste des enchères
        res.status(200).send(allAuctions);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des enchères', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const auctions = await HistoryAuction.findAll();
        res.status(200).send(auctions);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des enchères', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
