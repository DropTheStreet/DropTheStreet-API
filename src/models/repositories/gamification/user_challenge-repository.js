const { UserChallenge } = require('../../models/gamification/user_challenge.model.js');
const {Challenge} = require("../../models/gamification/challenge.model");

class UserChallengeRepository {
    async create(userChallengeData) {
        return UserChallenge.create(userChallengeData);
    }

    async findById(id) {
        return await UserChallenge.findByPk(id);
    }

    async findAll() {
        return await UserChallenge.findAll();
    }

    async update(id, updatedData) {
        const userChallenge = await UserChallenge.findByPk(id);
        if (!userChallenge) {
            throw new Error('User Challenge was not found');
        }
        return await userChallenge.update(updatedData);
    }

    async delete(id) {
        const userChallenge = await UserChallenge.findByPk(id);
        if (!userChallenge) {
            throw new Error('User Challenge was not found');
        }
        await userChallenge.destroy();
        return true;
    }

    async getUserChallengesByUserId(id_user) {
        return await UserChallenge.findAll({
            where: { id_user },
            include: [
                {
                    model: Challenge,
                    attributes: ['id_challenge', 'name', 'description', 'reward', 'is_actif']
                }
            ],
            attributes: ['id_user_challenge', 'progression', 'is_finished', 'end_date']
        });
    }
}

module.exports = new UserChallengeRepository();