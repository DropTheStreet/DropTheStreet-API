const { UserChallenge } = require('../../models/gamification/user_challenge.model.js');

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
}

module.exports = new UserChallengeRepository();