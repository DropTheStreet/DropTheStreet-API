const { UserChallenge } = require('../../models/gamification/user_challenge.model.js');

class UserChallengeRepository {
    async create(userChallengeData) {
        return await User_Challenge.create(userChallengeData);
    }

    async findById(id) {
        return await User_Challenge.findByPk(id);
    }

    async findAll() {
        return await User_Challenge.findAll();
    }

    async update(id, updatedData) {
        const userChallenge = await User_Challenge.findByPk(id);
        if (!userChallenge) {
            throw new Error('User_Challenge non trouvé');
        }
        return await userChallenge.update(updatedData);
    }

    async delete(id) {
        const userChallenge = await User_Challenge.findByPk(id);
        if (!userChallenge) {
            throw new Error('User_Challenge non trouvé');
        }
        await userChallenge.destroy();
        return true;
    }
}

module.exports = new UserChallengeRepository();