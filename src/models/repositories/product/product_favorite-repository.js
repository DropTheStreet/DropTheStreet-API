const { ProductFavorite } = require('../../models/product/product_favorite.model.js');

class ProductFavoriteRepository {
    async create(productFavoriteData) {
        return await ProductFavorite.create(productFavoriteData);
    }

    async findById(id) {
        return await ProductFavorite.findByPk(id);
    }

    async findAll() {
        return await ProductFavorite.findAll();
    }

    async delete(id) {
        const productFavorite = await ProductFavorite.findByPk(id);
        if (!productFavorite) {
            throw new Error('Product favorite not found');
        }
        await productFavorite.destroy();
        return true;
    }
}

module.exports = new ProductFavoriteRepository();

