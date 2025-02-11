const { Product } = require('../../models/product/product.model.js');

class ProductRepository {
    async create(productData) {
        return await Product.create(productData);
    }

    async findById(id) {
        return await Product.findByPk(id);
    }

    async findAll() {
        return await Product.findAll();
    }

    async update(id, updatedData) {
        const product = await Product.findByPk(id);
        if (!product) {
            throw new Error('Product not found');
        }
        return await product.update(updatedData);
    }

    async delete(id) {
        const product = await Product.findByPk(id);
        if (!product) {
            throw new Error('Product not found');
        }
        await product.destroy();
        return true;
    }
}

module.exports = new ProductRepository();
