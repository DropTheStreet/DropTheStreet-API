const express = require('express');
const router = express.Router();
const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
const { v4: uuidv4 } = require('uuid');

router.post('/seeder', async (req, res) => {
    try {

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

        for (let status of paymentStatuses) {
            await PaymentStatus.create({
                name: status.name,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Status of payment was added : ${status.name}`);
        }

        const statuses = await PaymentStatus.findAll();

        res.status(200).send(statuses);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during of adding a status payment', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const statuses = await PaymentStatus.findAll();
        res.status(200).send(statuses);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of all payments statuses', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
