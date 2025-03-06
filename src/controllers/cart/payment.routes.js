const express = require('express');
const router = express.Router();
const { Payment } = require('../../models/models/cart/payment.model');
const { PaymentDetail } = require('../../models/models/cart/payment_detail.model');
const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
const { User } = require('../../models/models/user/user.model');
const { Product } = require('../../models/models/product/product.model');
const { v4: uuidv4 } = require('uuid');
const UserRepository = require("../../models/repositories/user/user-repository");

router.post('/seeder', async (req, res) => {
    try {
        const users = await UserRepository.getUsersByRoleName('User');
        if (users.length < 1) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const sellers = await UserRepository.getUsersByRoleName('Seller');
        if (sellers.length < 1) {
            return res.status(400).send({ message: 'Not enough sellers for seeding' });
        }

        const admins = await UserRepository.getUsersByRoleName('Admin');
        if (admins.length < 1) {
            return res.status(400).send({ message: 'Not enough admins for seeding' });
        }

        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }

        const paymentStatuses = await PaymentStatus.findAll();
        if (paymentStatuses.length < 3) {
            return res.status(400).send({ message: 'Not enough payment statuses for seeding' });
        }

        const payments = [
            {
                id_user: users[0].id_user,
                id_payment_status: paymentStatuses[0].id_payment_status,
                amount_total: 250.00,
                delivery_address: '123 Rue Exemple, Paris, France',
                payment_date: new Date(),
                id_seller: sellers[0].id_user,
                products: [
                    { id_product: products[0].id_product, quantity: 2, price_at_purchase: 50.00 },
                    { id_product: products[1].id_product, quantity: 1, price_at_purchase: 150.00 },
                ],
            },
            {
                id_user: admins[0].id_user,
                id_payment_status: paymentStatuses[1].id_payment_status,
                amount_total: 180.00,
                delivery_address: '456 Avenue Exemple, Lyon, France',
                payment_date: new Date(),
                id_seller: sellers[0].id_user,
                products: [
                    { id_product: products[1].id_product, quantity: 1, price_at_purchase: 100.00 },
                    { id_product: products[2].id_product, quantity: 2, price_at_purchase: 40.00 },
                ],
            },
        ];

        for (let payment of payments) {
            const newPayment = await Payment.create({
                id_payment: uuidv4(),
                id_user: payment.id_user,
                id_payment_status: payment.id_payment_status,
                amount_total: payment.amount_total,
                delivery_address: payment.delivery_address,
                payment_date: payment.payment_date,
                id_seller: payment.id_seller,
            });

            for (let product of payment.products) {
                await PaymentDetail.create({
                    id_payment_detail: uuidv4(),
                    id_payment: newPayment.id_payment,
                    id_product: product.id_product,
                    quantity: product.quantity,
                    price_at_purchase: product.price_at_purchase,
                });
            }

            console.log(`Payment created successfully for user ${payment.id_user}`);
        }

        const allPayments = await Payment.findAll({ include: PaymentDetail });

        res.status(200).send(allPayments);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of payments', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const payments = await Payment.findAll({ include: PaymentDetail });
        res.status(200).send(payments);
    } catch (e) {
        res.status(500).send({ message: 'Error getting all payments', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
