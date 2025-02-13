const { UserBadge } = require('../../models/gamification/user_badge.model.js');

class UserBadgeRepository {
    async create(userBadgeData) {
        return UserBadge.create(userBadgeData);
    }

    async findById(id) {
        return await UserBadge.findByPk(id);
    }

    async findAll() {
        return await UserBadge.findAll();
    }

    async update(id, updatedData) {
        const userBadge = await UserBadge.findByPk(id);
        if (!userBadge) {
            throw new Error('User Badge was not found');
        }
        return await userBadge.update(updatedData);
    }

    async delete(id) {
        const userBadge = await UserBadge.findByPk(id);
        if (!userBadge) {
            throw new Error('User Badge was not found');
        }
        await userBadge.destroy();
        return true;
    }
}

module.exports = new UserBadgeRepository();
