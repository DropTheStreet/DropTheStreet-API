const express = require('express');
const router = express.Router();
const { Payment } = require('../../models/models/cart/payment.model');
const { PaymentDetail } = require('../../models/models/cart/payment_detail.model');
const PaymentDetailRepository = require("../../models/repositories/cart/payment_detail-repository");


router.get('/', async (req, res) => {
    try {
        const payments = await Payment.findAll({ include: PaymentDetail });
        res.status(200).send(payments);
    } catch (e) {
        res.status(500).send({ message: 'Error getting payments', error: e.message });
    }
});

router.get('/history/:id_user', async (req, res) => {
    try {
        const { id_user } = req.params;
        const paymentDetails = await PaymentDetailRepository.findHistoryByUserId(id_user);

        if (!paymentDetails || paymentDetails.length === 0) {
            return res.status(404).json({ message: 'No payment details found for this user' });
        }

        res.status(200).json(paymentDetails);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching payment details', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
