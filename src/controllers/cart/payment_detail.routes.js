const express = require('express');
const router = express.Router();
const { Payment } = require('../../models/models/cart/payment.model');
const { PaymentDetail } = require('../../models/models/cart/payment_detail.model');


router.get('/', async (req, res) => {
    try {
        const payments = await Payment.findAll({ include: PaymentDetail });
        res.status(200).send(payments);
    } catch (e) {
        res.status(500).send({ message: 'Error getting payments', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
