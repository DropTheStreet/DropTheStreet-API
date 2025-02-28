const { UserBadge } = require('../../models/gamification/user_badge.model.js');
const {Badge} = require("../../models/gamification/badge.model");

class UserBadgeRepository {
    async create(userBadgeData) {
        return UserBadge.create(userBadgeData);
    }

    async findById(id) {
        return await UserBadge.findByPk(id);
    }

    async findAll() {
        return await UserBadge.findAll(
            {
                include: [{
                    model: Badge,
                    attributes: ['id_badge', 'name', 'description', 'image']
                }],
                nest: true
            });
    }

    async findBadgesByUserId(id_user) {
        return await UserBadge.findAll({
            where: {
                id_user: id_user
            },
            include: [{
                model: Badge,
            }]
        });
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
