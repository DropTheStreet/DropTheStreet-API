const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/user/user.routes');

// Mock de tous les modèles Sequelize
jest.mock('../../models/mysql.db', () => ({
    sequelize: {
        sync: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
        define: jest.fn().mockReturnValue({
            create: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn()
        })
    }
}));

jest.mock('../../models/models/user/user.model', () => ({
    User: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

jest.mock('../../models/models/user/role.model', () => ({
    Role: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn()
    }
}));

const { User } = require('../../models/models/user/user.model');

const app = express();
app.use(express.json());
app.use('/users', initializeRoutes());

describe('User Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testUsers: [
                {
                    id_user: 'user-1',
                    pseudo: 'adrien',
                    email: 'adrien@example.com',
                    dropcoins: 1000
                },
                {
                    id_user: 'user-2',
                    pseudo: 'marie',
                    email: 'marie@example.com',
                    dropcoins: 500
                },
                {
                    id_user: 'user-3',
                    pseudo: 'paul',
                    email: 'paul@example.com',
                    dropcoins: 750
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup des mocks par défaut
        User.create.mockImplementation((data) => Promise.resolve({
            id_user: 'new-user-id',
            ...data
        }));

        User.findAll.mockResolvedValue(mockTestData.testUsers);
    });

    it('should create users with /seeder', async () => {
        // Mock pour les rôles
        const mockRoles = [
            { id_role: 'role-1', name: 'Admin' },
            { id_role: 'role-2', name: 'User' },
            { id_role: 'role-3', name: 'Seller' }
        ];

        // Mock pour le modèle Role
        const { Role } = require('../../models/models/user/role.model');
        Role.findAll = jest.fn().mockResolvedValue(mockRoles);

        // Mock pour le seeder qui crée 3 utilisateurs
        User.create
            .mockResolvedValueOnce({ id_user: 'admin-id', pseudo: 'admin', email: 'admin@gmail.com' })
            .mockResolvedValueOnce({ id_user: 'user-id', pseudo: 'user', email: 'user@gmail.com' })
            .mockResolvedValueOnce({ id_user: 'seller-id', pseudo: 'seller', email: 'seller@gmail.com' });

        const response = await request(app).post('/users/seeder');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
        expect(User.create).toHaveBeenCalledTimes(3);
    });

    it('should get users with /users', async () => {
        const response = await request(app).get('/users');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
        expect(User.findAll).toHaveBeenCalled();
    });

    it('should return 500 on database error for seeder', async () => {
        const { Role } = require('../../models/models/user/role.model');
        Role.findAll = jest.fn().mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).post('/users/seeder');

        expect(response.status).toBe(500);
    });

    it('should return 500 on database error for get users', async () => {
        User.findAll.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).get('/users');

        expect(response.status).toBe(500);
    });
});
