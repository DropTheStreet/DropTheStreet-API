const express = require('express');
const router = express.Router();
const { Auction } = require('../../models/models/auction/auction.model');
const { v4: uuidv4 } = require('uuid');

router.get('/seeder', async (req, res) => {
    try {
        // Liste des enchères fictives à ajouter
        const auctions = [
            {
                initial_price: 1000, // Prix initial
                actual_price: 1500,  // Prix actuel
                start_date: new Date('2025-02-10T10:00:00Z'),
                end_date: new Date('2025-02-12T10:00:00Z')
            },
            {
                initial_price: 500,
                actual_price: 750,
                start_date: new Date('2025-02-11T12:00:00Z'),
                end_date: new Date('2025-02-14T12:00:00Z')
            },
            {
                initial_price: 2000,
                actual_price: 2500,
                start_date: new Date('2025-02-13T15:00:00Z'),
                end_date: new Date('2025-02-20T15:00:00Z')
            },
        ];

        // Création des enchères
        for (let auction of auctions) {
            await Auction.create({
                id_auction: uuidv4(),
                initial_price: auction.initial_price,
                actual_price: auction.actual_price,
                start_date: auction.start_date,
                end_date: auction.end_date
            });
            console.log(`Enchère ajoutée avec un prix initial de ${auction.initial_price}`);
        }

        // Récupérer toutes les enchères
        const allAuctions = await Auction.findAll();

        // Retourner la liste des enchères
        res.status(200).send(allAuctions);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des enchères', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const auctions = await Auction.findAll();
        res.status(200).send(auctions);
    } catch (e) {
        res.status(500).send({ message: 'Erreur lors de la récupération des enchères', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
