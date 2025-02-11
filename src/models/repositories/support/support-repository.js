const { Support } = require('../../models/support/support.model.js');

class SupportRepository {
    async create(supportData) {
        return await Support.create(supportData);
    }

    async findById(id) {
        return await Support.findByPk(id);
    }

    async findAll() {
        return await Support.findAll();
    }

    async update(id, updatedData) {
        const support = await Support.findByPk(id);
        if (!support) {
            throw new Error('Support request not found');
        }
        return await support.update(updatedData);
    }

    async delete(id) {
        const support = await Support.findByPk(id);
        if (!support) {
            throw new Error('Support request not found');
        }
        await support.destroy();
        return true;
    }
}

module.exports = new SupportRepository();
