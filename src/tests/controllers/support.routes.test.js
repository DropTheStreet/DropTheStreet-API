const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/support/support.routes');

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

jest.mock('../../models/models/support/support.model', () => ({
    Support: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

const { Support } = require('../../models/models/support/support.model');

const app = express();
app.use(express.json());
app.use('/support', initializeRoutes());

describe('Support Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testTickets: [
                {
                    id_support: 'support-1',
                    subject: 'Problème de connexion',
                    message: 'Je ne peux pas me connecter à mon compte.',
                    is_resolved: false
                },
                {
                    id_support: 'support-2',
                    subject: 'Demande de remboursement',
                    message: 'Je souhaite demander un remboursement pour mon achat.',
                    is_resolved: false
                },
                {
                    id_support: 'support-3',
                    subject: 'Problème de paiement',
                    message: 'Le paiement a échoué lors de la commande.',
                    is_resolved: true
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup des mocks par défaut
        Support.create.mockImplementation((data) => Promise.resolve({ 
            id_support: 'new-support-id', 
            ...data 
        }));
        
        Support.findAll.mockResolvedValue(mockTestData.testTickets);
        Support.findOne.mockResolvedValue(null);
    });

    describe('POST /seeder', () => {
        it('should create support tickets successfully', async () => {
            // Mock pour créer 3 tickets
            Support.create
                .mockResolvedValueOnce(mockTestData.testTickets[0])
                .mockResolvedValueOnce(mockTestData.testTickets[1])
                .mockResolvedValueOnce(mockTestData.testTickets[2]);

            const response = await request(app)
                .post('/support/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(Support.create).toHaveBeenCalledTimes(3);
            expect(Support.findAll).toHaveBeenCalled();
        });

        it('should not create duplicate tickets', async () => {
            // Mock pour simuler un ticket existant
            Support.findOne.mockResolvedValueOnce(mockTestData.testTickets[0]);
            Support.findOne.mockResolvedValueOnce(null);
            Support.findOne.mockResolvedValueOnce(null);

            const response = await request(app)
                .post('/support/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            // Seulement 2 tickets créés car le premier existe déjà
            expect(Support.create).toHaveBeenCalledTimes(2);
        });

        it('should return 500 on database error', async () => {
            Support.findOne.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/support/seeder');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during creation of support ticket');
        });
    });

    describe('GET /', () => {
        it('should return all support tickets successfully', async () => {
            const response = await request(app)
                .get('/support');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toHaveProperty('subject');
            expect(response.body[0]).toHaveProperty('message');
            expect(response.body[0]).toHaveProperty('is_resolved');
            expect(Support.findAll).toHaveBeenCalledWith({
                order: [['subject', 'ASC']]
            });
        });

        it('should return empty array if no tickets exist', async () => {
            Support.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/support');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return 500 on database error', async () => {
            Support.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/support');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting of support tickets');
        });
    });
});
