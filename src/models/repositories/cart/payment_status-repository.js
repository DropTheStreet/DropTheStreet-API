const { PaymentStatus } = require('../../models/cart/payment_status.model.js');

class PaymentStatusRepository {
    async create(paymentStatusData) {
        return await PaymentStatus.create(paymentStatusData);
    }

    async findById(id) {
        return await PaymentStatus.findByPk(id);
    }

    async findAll() {
        return await PaymentStatus.findAll();
    }

    async update(id, updatedData) {
        const paymentStatus = await PaymentStatus.findByPk(id);
        if (!paymentStatus) {
            throw new Error('PaymentStatus non trouvé');
        }
        return await paymentStatus.update(updatedData);
    }

    async delete(id) {
        const paymentStatus = await PaymentStatus.findByPk(id);
        if (!paymentStatus) {
            throw new Error('PaymentStatus non trouvé');
        }
        await paymentStatus.destroy();
        return true;
    }
}

module.exports = new PaymentStatusRepository();
