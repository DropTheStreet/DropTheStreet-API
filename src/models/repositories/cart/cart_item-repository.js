const { CartItem } = require('../../models/cart/cart_item.model.js');
const {Product} = require("../../models/product/product.model");
const {Drop} = require("../../models/drop/drop.model");
const {Auction} = require("../../models/auction/auction.model");
const {ProductImage} = require("../../models/product/product_image.model");
const {Image} = require("../../models/product/image.model");

class CartItemRepository {
    async create(data) {
        return CartItem.create(data);
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

    async findByUserId(id_user) {
        return await CartItem.findAll({
            where: { id_user },
            attributes: ['id_cart_item', 'id_user', 'id_drop', 'id_auction', 'id_product'],
            include: [
                {
                    model: Drop,
                    attributes: ['price', 'quantity', 'size']
                },
                {
                    model: Auction,
                    attributes: ['actual_price', 'size']
                },
                {
                    model: Product,
                    attributes: ['name', 'description'],
                    include: [
                        {
                            model: ProductImage,
                            attributes: ['id_product_image'],
                            include: [
                                {
                                    model: Image,
                                    attributes: ['id_image', 'image']
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }

    async deleteById(id_cart_item) {
        const cartItem = await CartItem.findByPk(id_cart_item);
        if (!cartItem) {
            throw new Error('CartItem not found');
        }
        await cartItem.destroy();
        return { message: 'CartItem successfully deleted' };
    }


    /**
     * Vide le panier d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<number>} - Nombre d'éléments supprimés
     */
    static async clearUserCart(userId) {
        try {
            const deletedCount = await CartItem.destroy({
                where: {
                    id_user: userId
                }
            });

            console.log(`${deletedCount} éléments supprimés du panier de l'utilisateur ${userId}`);
            return deletedCount;
        } catch (error) {
            console.error('Erreur lors de la suppression du panier:', error);
            throw error;
        }
    }

    /**
     * Vérifie si un utilisateur a des éléments dans son panier
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>} - True si le panier contient des éléments
     */
    static async hasCartItems(userId) {
        try {
            const count = await CartItem.count({
                where: {
                    id_user: userId
                }
            });
            return count > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification du panier:', error);
            throw error;
        }
    }

    /**
     * Obtient le nombre total d'éléments dans le panier d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<number>} - Nombre d'éléments dans le panier
     */
    static async getCartItemCount(userId) {
        try {
            const count = await CartItem.count({
                where: {
                    id_user: userId
                }
            });
            return count;
        } catch (error) {
            console.error('Erreur lors du comptage des éléments du panier:', error);
            throw error;
        }
    }
}

module.exports = new CartItemRepository();