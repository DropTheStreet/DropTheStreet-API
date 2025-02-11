const { UserBadge } = require('../../models/gamification/user_badge.model.js');

class UserBadgeRepository {
    async create(userBadgeData) {
        return await User_Badge.create(userBadgeData);
    }

    async findById(id) {
        return await User_Badge.findByPk(id);
    }

    async findAll() {
        return await User_Badge.findAll();
    }

    async update(id, updatedData) {
        const userBadge = await User_Badge.findByPk(id);
        if (!userBadge) {
            throw new Error('User_Badge non trouvé');
        }
        return await userBadge.update(updatedData);
    }

    async delete(id) {
        const userBadge = await User_Badge.findByPk(id);
        if (!userBadge) {
            throw new Error('User_Badge non trouvé');
        }
        await userBadge.destroy();
        return true;
    }
}

module.exports = new UserBadgeRepository();
