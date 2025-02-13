const { Payment } = require('../../models/cart/payment.model.js');

class PaymentRepository {
    async create(paymentData) {
        return Payment.create(paymentData);
    }

    async findById(id) {
        return await Payment.findByPk(id);
    }

    async findAll() {
        return await Payment.findAll();
    }

    async update(id, updatedData) {
        const payment = await Payment.findByPk(id);
        if (!payment) {
            throw new Error('Payment was not found');
        }
        return await payment.update(updatedData);
    }

    async delete(id) {
        const payment = await Payment.findByPk(id);
        if (!payment) {
            throw new Error('Payment was not found');
        }
        await payment.destroy();
        return true;
    }
}

module.exports = new PaymentRepository();