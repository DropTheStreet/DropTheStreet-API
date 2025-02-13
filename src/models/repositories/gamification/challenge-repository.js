const { Challenge } = require('../../models/gamification/challenge.model.js');

class ChallengeRepository {
    async create(challengeData) {
        return Challenge.create(challengeData);
    }

    async findById(id) {
        return await Challenge.findByPk(id);
    }

    async findAll() {
        return await Challenge.findAll();
    }

    async update(id, updatedData) {
        const challenge = await Challenge.findByPk(id);
        if (!challenge) {
            throw new Error('Challenge was not found');
        }
        return await challenge.update(updatedData);
    }

    async delete(id) {
        const challenge = await Challenge.findByPk(id);
        if (!challenge) {
            throw new Error('Challenge was not found');
        }
        await challenge.destroy();
        return true;
    }
}

module.exports = new ChallengeRepository();
