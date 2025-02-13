const express = require('express');
const router = express.Router();
const { Payment } = require('../../models/models/cart/payment.model');
const { v4: uuidv4 } = require('uuid');
const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
const { User } = require('../../models/models/user/user.model');
const { Product } = require('../../models/models/product/product.model');

router.post('/seeder', async (req, res) => {
    try {

        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }

        const paymentStatuses = await PaymentStatus.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough paymentStatuses for seeding' });
        }


        const payments = [
            {
                id_user: users[0].id_user,
                id_product: products[0].id_product,
                id_payment_status: paymentStatuses[0].id_payment_status,
                amount_total: 150.00,
                delivery_address: '123 Rue Exemple, Paris, France',
                payment_date: new Date(),
            },
            {
                id_user: users[1].id_user,
                id_product: products[1].id_product,
                id_payment_status: paymentStatuses[1].id_payment_status,
                amount_total: 100.50,
                delivery_address: '456 Avenue Exemple, Lyon, France',
                payment_date: new Date(),
            },
        ];

        for (let payment of payments) {
            await Payment.create({
                id_payment: uuidv4(),
                id_user: payment.id_user,
                id_product: payment.id_product,
                id_payment_status: payment.id_payment_status,
                amount_total: payment.amount_total,
                delivery_address: payment.delivery_address,
                payment_date: payment.payment_date,
            });
            console.log(`Payment was added successfully ${payment.id_user}`);
        }

        const allPayments = await Payment.findAll();

        res.status(200).send(allPayments);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of payments', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const payments = await Payment.findAll();
        res.status(200).send(payments);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting all payments', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
