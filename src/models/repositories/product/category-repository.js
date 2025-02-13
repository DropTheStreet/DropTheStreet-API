const { Category } = require('../../models/product/category.model.js');

class CategoryRepository {
    async create(categoryData) {
        return Category.create(categoryData);
    }

    async findById(id) {
        return await Category.findByPk(id);
    }

    async findAll() {
        return await Category.findAll();
    }

    async update(id, updatedData) {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new Error('Category was not found');
        }
        return await category.update(updatedData);
    }

    async delete(id) {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new Error('Category was not found');
        }
        await category.destroy();
        return true;
    }
}

module.exports = new CategoryRepository();