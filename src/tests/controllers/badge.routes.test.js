const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/gamification/badge.routes');

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

jest.mock('../../models/models/gamification/badge.model', () => ({
    Badge: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

const { Badge } = require('../../models/models/gamification/badge.model');

const app = express();
app.use(express.json());
app.use('/badge', initializeRoutes());

describe('Badge Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testBadges: [
                {
                    id_badge: 'badge-1',
                    name: 'DropStreeter débutant',
                    description: 'Récompense pour les nouveaux utilisateurs.',
                    image: null
                },
                {
                    id_badge: 'badge-2',
                    name: 'Badge de Milestone',
                    description: 'Récompense pour avoir atteint une étape importante.',
                    image: null
                },
                {
                    id_badge: 'badge-3',
                    name: 'Badge VIP',
                    description: 'Récompense pour les utilisateurs les plus actifs.',
                    image: null
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup des mocks par défaut
        Badge.create.mockImplementation((data) => Promise.resolve({ 
            id_badge: 'new-badge-id', 
            ...data 
        }));
        
        Badge.findAll.mockResolvedValue(mockTestData.testBadges);
        Badge.findByPk.mockResolvedValue(mockTestData.testBadges[0]);
        Badge.findOne.mockResolvedValue(null);
    });

    describe('POST /seeder', () => {
        it('should create badges successfully', async () => {
            // Mock pour créer 3 badges
            Badge.create
                .mockResolvedValueOnce(mockTestData.testBadges[0])
                .mockResolvedValueOnce(mockTestData.testBadges[1])
                .mockResolvedValueOnce(mockTestData.testBadges[2]);

            const response = await request(app)
                .post('/badge/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0].name).toBe('DropStreeter débutant');
            expect(response.body[1].name).toBe('Badge de Milestone');
            expect(response.body[2].name).toBe('Badge VIP');
            expect(Badge.create).toHaveBeenCalledTimes(3);
            expect(Badge.findAll).toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            Badge.create.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/badge/seeder');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during adding of badge');
        });
    });

    describe('GET /', () => {
        it('should return all badges successfully', async () => {
            const response = await request(app)
                .get('/badge');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0]).toHaveProperty('description');
            expect(response.body[0].name).toBe('DropStreeter débutant');
            expect(Badge.findAll).toHaveBeenCalled();
        });

        it('should return empty array if no badges exist', async () => {
            Badge.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/badge');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return 500 on database error', async () => {
            Badge.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/badge');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting of badges');
        });
    });
});
