const express = require('express');
const router = express.Router();
const { UserChallenge } = require('../../models/models/gamification/user_challenge.model');
const { v4: uuidv4 } = require('uuid');
const {User} = require("../../models/models/user/user.model");
const {Challenge} = require("../../models/models/gamification/challenge.model");
const UserChallengeRepository = require("../../models/repositories/gamification/user_challenge-repository");
router.post('/seeder', async (req, res) => {
    try {

        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const challenges = await Challenge.findAll();
        if (challenges.length < 3) {
            return res.status(400).send({ message: 'Not enough challenges for seeding' });
        }

        const challengesToCreate = [
            {
                progression: 3,
                is_finished: false,
                end_date: new Date('2025-12-31'),
                id_user: users[0].id_user,
                id_challenge: challenges[0].id_challenge
            },
            {
                progression: 7,
                is_finished: false,
                end_date: new Date('2025-11-30'),
                id_user: users[1].id_user,
                id_challenge: challenges[1].id_challenge
            },
            {
                progression: 1,
                is_finished: false,
                end_date: new Date('2025-10-15') ,
                id_user: users[2].id_user,
                id_challenge: challenges[2].id_challenge
            }
        ];

        for (let challenge of challengesToCreate) {
            await UserChallenge.create({
                progression: challenge.progression,
                is_finished: challenge.is_finished,
                end_date: challenge.end_date,
                id_user: challenge.id_user,
                id_challenge: challenge.id_challenge,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Challenges for user was added successfully ${challenge.progression}%`);
        }

        const userChallenges = await UserChallenge.findAll();

        res.status(200).send(userChallenges);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during creation of user challenges', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const userChallenges = await UserChallenge.findAll();
        res.status(200).send(userChallenges);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of user challenges', error: e.message });
    }
});

router.get('/:id_user', async (req, res) => { // Ensure `router.get` is called
    const { id_user } = req.params;

    try {
        const userChallenges = await UserChallengeRepository.getUserChallengesByUserId(id_user);
        if (!userChallenges || userChallenges.length === 0) {
            return res.status(404).send({ message: 'No challenges found for this user' });
        }

        res.status(200).send(userChallenges);
    } catch (error) {
        console.error('Error fetching user challenges by user ID:', error);
        res.status(500).send({ message: 'Error fetching user challenges', error: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
