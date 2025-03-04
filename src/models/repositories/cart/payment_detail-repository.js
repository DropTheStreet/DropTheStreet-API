const { PaymentDetail } = require('../../models/cart/payment_detail.model.js');
const {Payment} = require("../../models/cart/payment.model");
const {Product} = require("../../models/product/product.model");

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

    async findHistoryByUserId(userId) {
        return await PaymentDetail.findAll({
            include: [
                {
                    model: Payment,
                    where: { id_user: userId },
                    attributes: ['payment_date'],
                },
                {
                    model: Product,
                    attributes: ['id_product', 'name'],
                }
            ],
            attributes: ['id_product', 'quantity', 'price_at_purchase']
        });
    }

}

module.exports = new PaymentDetailRepository();