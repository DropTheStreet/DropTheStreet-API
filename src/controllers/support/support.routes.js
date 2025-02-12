const express = require('express');
const router = express.Router();
const { Support } = require('../../models/models/support/support.model');

router.post('/seeder', async (req, res) => {
    try {
        const ticketsToCreate = [
            { subject: 'Problème de connexion', message: 'Je ne peux pas me connecter à mon compte.', is_resolved: false },
            { subject: 'Demande de remboursement', message: 'Je souhaite demander un remboursement pour mon achat.', is_resolved: false },
            { subject: 'Problème de paiement', message: 'Le paiement a échoué lors de la commande.', is_resolved: true }
        ];

        for (let ticket of ticketsToCreate) {
            const existingTicket = await Support.findOne({ where: { subject: ticket.subject } });
            if (existingTicket) {
                console.log(`Ticket with this subject "${ticket.subject}" already exist`);
            } else {
                await Support.create({
                    subject: ticket.subject,
                    message: ticket.message,
                    is_resolved: ticket.is_resolved,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Ticket with this subject "${ticket.subject}" was created successfully`);
            }
        }

        const tickets = await Support.findAll({
            order: [['subject', 'ASC']],
        });

        res.status(200).send(tickets);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during creation of support ticket', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const tickets = await Support.findAll({
            order: [['subject', 'ASC']],
        });
        res.status(200).send(tickets);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of support tickets', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
