const { CartItem } = require('../../models/cart/cart_item.model.js');

class CartItemRepository {
    async create(paymentData) {
        return CartItem.create(paymentData);
    }

    async findById(id) {
        return await CartItem.findByPk(id);
    }

    async findAll() {
        return await CartItem.findAll();
    }

    async update(id, updatedData) {
        const cartItem = await CartItem.findByPk(id);
        if (!cartItem) {
            throw new Error('Payment was not found');
        }
        return await cartItem.update(updatedData);
    }

    async delete(id) {
        const cartItem = await CartItem.findByPk(id);
        if (!cartItem) {
            throw new Error('Payment was not found');
        }
        await cartItem.destroy();
        return true;
    }
}

module.exports = new CartItemRepository();