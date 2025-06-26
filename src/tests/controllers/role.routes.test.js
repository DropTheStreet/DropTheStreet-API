const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/user/role.routes');

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

jest.mock('../../models/models/user/role.model', () => ({
    Role: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

const { Role } = require('../../models/models/user/role.model');

const app = express();
app.use(express.json());
app.use('/role', initializeRoutes());

describe('Role Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testRoles: [
                {
                    id_role: 'role-1',
                    name: 'Admin'
                },
                {
                    id_role: 'role-2',
                    name: 'User'
                },
                {
                    id_role: 'role-3',
                    name: 'Seller'
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup des mocks par défaut
        Role.create.mockImplementation((data) => Promise.resolve({ 
            id_role: 'new-role-id', 
            ...data 
        }));
        
        Role.findAll.mockResolvedValue(mockTestData.testRoles);
        Role.findOne.mockResolvedValue(null);
    });

    describe('POST /seeder', () => {
        it('should create roles successfully', async () => {
            // Mock pour créer 3 rôles
            Role.create
                .mockResolvedValueOnce(mockTestData.testRoles[0])
                .mockResolvedValueOnce(mockTestData.testRoles[1])
                .mockResolvedValueOnce(mockTestData.testRoles[2]);

            const response = await request(app)
                .post('/role/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0].name).toBe('Admin');
            expect(response.body[1].name).toBe('User');
            expect(response.body[2].name).toBe('Seller');
            expect(Role.create).toHaveBeenCalledTimes(3);
            expect(Role.findAll).toHaveBeenCalled();
        });

        it('should not create duplicate roles', async () => {
            // Mock pour simuler un rôle existant
            Role.findOne.mockResolvedValueOnce(mockTestData.testRoles[0]); // Admin existe
            Role.findOne.mockResolvedValueOnce(null); // User n'existe pas
            Role.findOne.mockResolvedValueOnce(null); // Seller n'existe pas

            const response = await request(app)
                .post('/role/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            // Seulement 2 rôles créés car Admin existe déjà
            expect(Role.create).toHaveBeenCalledTimes(2);
        });

        it('should return 500 on database error', async () => {
            Role.findOne.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/role/seeder');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during roles creation');
        });
    });

    describe('GET /', () => {
        it('should return all roles successfully', async () => {
            const response = await request(app)
                .get('/role');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0].name).toBe('Admin');
            expect(Role.findAll).toHaveBeenCalledWith({
                order: [['name', 'ASC']]
            });
        });

        it('should return empty array if no roles exist', async () => {
            Role.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/role');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return 500 on database error', async () => {
            Role.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/role');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting of roles');
        });
    });
});
