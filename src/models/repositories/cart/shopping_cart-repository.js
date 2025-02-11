const { ShoppingCart } = require('../../models/cart/shopping_cart.model.js');

class ShoppingCartRepository {
    async create(shoppingCartData) {
        return await ShoppingCart.create(shoppingCartData);
    }

    async findById(id) {
        return await ShoppingCart.findByPk(id);
    }

    async findByUserId(userId) {
        return await ShoppingCart.findAll({
            where: { id_user: userId }
        });
    }

    async findByUserAndProduct(userId, productId) {
        return await ShoppingCart.findOne({
            where: {
                id_user: userId,
                id_product: productId
            }
        });
    }

    async update(id, updatedData) {
        const shoppingCart = await ShoppingCart.findByPk(id);
        if (!shoppingCart) {
            throw new Error('ShoppingCart non trouvé');
        }
        return await shoppingCart.update(updatedData);
    }

    async delete(id) {
        const shoppingCart = await ShoppingCart.findByPk(id);
        if (!shoppingCart) {
            throw new Error('ShoppingCart non trouvé');
        }
        await shoppingCart.destroy();
        return true;
    }

    async deleteByUserId(userId) {
        return await ShoppingCart.destroy({
            where: { id_user: userId }
        });
    }
}

module.exports = new ShoppingCartRepository();