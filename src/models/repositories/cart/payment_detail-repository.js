const { PaymentDetail } = require('../../models/cart/payment_detail.model.js');

class PaymentDetailRepository {
    async create(paymentDetailData) {
        return PaymentDetail.create(paymentDetailData);
    }

    async findById(id) {
        return await PaymentDetail.findByPk(id);
    }

    async findAll() {
        return await PaymentDetail.findAll();
    }

    async update(id, updatedData) {
        const paymentDetail = await PaymentDetail.findByPk(id);
        if (!paymentDetail) {
            throw new Error('Payment detail was not found');
        }
        return await paymentDetail.update(updatedData);
    }

    async delete(id) {
        const paymentDetail = await PaymentDetail.findByPk(id);
        if (!paymentDetail) {
            throw new Error('Payment detail was not found');
        }
        await paymentDetail.destroy();
        return true;
    }
}

module.exports = new PaymentDetailRepository();