const { ProductImage } = require('../../models/product/product_image.model.js');

class ProductImageRepository {
    async create(productImageData) {
        return await ProductImage.create(productImageData);
    }

    async findById(id) {
        return await ProductImage.findByPk(id);
    }

    async findAll() {
        return await ProductImage.findAll();
    }

    async update(id, updatedData) {
        const productImage = await ProductImage.findByPk(id);
        if (!productImage) {
            throw new Error('Product image not found');
        }
        return await productImage.update(updatedData);
    }

    async delete(id) {
        const productImage = await ProductImage.findByPk(id);
        if (!productImage) {
            throw new Error('Product image not found');
        }
        await productImage.destroy();
        return true;
    }
}

module.exports = new ProductImageRepository();