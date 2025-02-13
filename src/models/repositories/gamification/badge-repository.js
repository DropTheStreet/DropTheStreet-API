const { Badge } = require('../../models/gamification/badge.model.js');

class BadgeRepository {
    async create(badgeData) {
        return Badge.create(badgeData);
    }

    async findById(id) {
        return await Badge.findByPk(id);
    }

    async findAll() {
        return await Badge.findAll();
    }

    async update(id, updatedData) {
        const badge = await Badge.findByPk(id);
        if (!badge) {
            throw new Error('Badge was not found');
        }
        return await badge.update(updatedData);
    }

    async delete(id) {
        const badge = await Badge.findByPk(id);
        if (!badge) {
            throw new Error('Badge was not found');
        }
        await badge.destroy();
        return true;
    }
}

module.exports = new BadgeRepository();
