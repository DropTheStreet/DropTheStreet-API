const { ProductFavorite } = require('../../models/product/product_favorite.model.js');
const { Product } = require('../../models/product/product.model.js');
const { User } = require('../../models/user/user.model.js');
const { Category } = require('../../models/product/category.model.js');
const { Brand } = require('../../models/product/brand.model.js');
const {ProductImage} = require("../../models/product/product_image.model");
const {Image} = require("../../models/product/image.model");

class ProductFavoriteRepository {
    async create(productFavoriteData) {
        return ProductFavorite.create(productFavoriteData);
    }

    async findById(id) {
        return await ProductFavorite.findByPk(id);
    }

    async findAll() {
        return await ProductFavorite.findAll();
    }

    // Récupérer tous les favoris d'un utilisateur avec les détails produits
    async findByUserId(userId) {
        return await ProductFavorite.findAll({
            where: { id_user: userId },
            include: [
                {
                    model: Product,
                    as: 'Product',
                    include: [
                        { model: Category, as: 'Category' },
                        { model: Brand, as: 'Brand' },
                        {
                            model: ProductImage,
                            include: [
                                { model: Image }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
    }


    // Vérifie si un produit est déjà dans les favoris
    async findByUserAndProduct(userId, productId) {
        return await ProductFavorite.findOne({
            where: {
                id_user: userId,
                id_product: productId
            }
        });
    }

    // Ajoute un favori (évite les doublons)
    async addToFavorites(userId, productId) {
        const existingFavorite = await this.findByUserAndProduct(userId, productId);
        if (existingFavorite) {
            throw new Error('Ce produit est déjà dans vos favoris');
        }
        return await this.create({
            id_user: userId,
            id_product: productId
        });
    }

    // Récupère un favori avec tous les détails
    async findByIdWithDetails(favoriteId) {
        return await ProductFavorite.findByPk(favoriteId, {
            include: [
                {
                    model: Product,
                    as: 'Product',
                    include: [
                        { model: Category, as: 'Category' },
                        { model: Brand, as: 'Brand' }
                    ]
                },
                {
                    model: User,
                    as: 'User'
                }
            ]
        });
    }

    // Supprime un favori par son ID
    async deleteById(id) {
        const productFavorite = await ProductFavorite.findByPk(id);
        if (!productFavorite) {
            throw new Error('Product favorite was not found');
        }
        await productFavorite.destroy();
        return true;
    }

    // Supprime un favori via userId + productId
    async removeFromFavorites(userId, productId) {
        const productFavorite = await this.findByUserAndProduct(userId, productId);
        if (!productFavorite) {
            throw new Error('Ce produit n\'est pas dans vos favoris');
        }
        await productFavorite.destroy();
        return true;
    }
}

module.exports = new ProductFavoriteRepository();
