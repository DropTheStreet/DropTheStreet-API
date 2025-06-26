const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/gamification/challenge.routes');

// Mock de tous les modèles Sequelize
jest.mock('../../models/mysql.db', () => ({
    sequelize: {
        sync: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
        define: jest.fn().mockReturnValue({
            create: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            findOne: jest.fn()
        })
    }
}));

jest.mock('../../models/models/gamification/challenge.model', () => ({
    Challenge: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

const { Challenge } = require('../../models/models/gamification/challenge.model');

const app = express();
app.use(express.json());
app.use('/challenge', initializeRoutes());

describe('Challenge Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testChallenges: [
                {
                    id_challenge: 'challenge-1',
                    name: 'Défi de Lancement',
                    description: 'Participe à notre premier défi et gagne des récompenses exclusives!',
                    reward: 1000,
                    is_actif: true
                },
                {
                    id_challenge: 'challenge-2',
                    name: 'Défi de Mois',
                    description: 'Réussis toutes les tâches mensuelles et gagne une récompense.',
                    reward: 500,
                    is_actif: true
                },
                {
                    id_challenge: 'challenge-3',
                    name: 'Défi Spécial',
                    description: 'Un défi exclusif pour nos utilisateurs les plus fidèles.',
                    reward: 2000,
                    is_actif: false
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup des mocks par défaut
        Challenge.create.mockImplementation((data) => Promise.resolve({ 
            id_challenge: 'new-challenge-id', 
            ...data 
        }));
        
        Challenge.findAll.mockResolvedValue(mockTestData.testChallenges);
        Challenge.findByPk.mockResolvedValue(mockTestData.testChallenges[0]);
        Challenge.findOne.mockResolvedValue(null);
    });

    describe('POST /seeder', () => {
        it('should create challenges successfully', async () => {
            // Mock pour créer 3 défis
            Challenge.create
                .mockResolvedValueOnce(mockTestData.testChallenges[0])
                .mockResolvedValueOnce(mockTestData.testChallenges[1])
                .mockResolvedValueOnce(mockTestData.testChallenges[2]);

            const response = await request(app)
                .post('/challenge/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0].name).toBe('Défi de Lancement');
            expect(response.body[1].name).toBe('Défi de Mois');
            expect(response.body[2].name).toBe('Défi Spécial');
            expect(Challenge.create).toHaveBeenCalledTimes(3);
            expect(Challenge.findAll).toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            Challenge.create.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/challenge/seeder');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during creation of challenges');
        });
    });

    describe('GET /', () => {
        it('should return all challenges successfully', async () => {
            const response = await request(app)
                .get('/challenge');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0]).toHaveProperty('description');
            expect(response.body[0]).toHaveProperty('reward');
            expect(response.body[0]).toHaveProperty('is_actif');
            expect(response.body[0].name).toBe('Défi de Lancement');
            expect(Challenge.findAll).toHaveBeenCalled();
        });

        it('should return empty array if no challenges exist', async () => {
            Challenge.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/challenge');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return 500 on database error', async () => {
            Challenge.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/challenge');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting of challenges');
        });
    });
});
