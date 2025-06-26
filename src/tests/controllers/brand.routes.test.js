const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/product/brand.routes');

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

jest.mock('../../models/models/product/brand.model', () => ({
    Brand: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

const { Brand } = require('../../models/models/product/brand.model');

const app = express();
app.use(express.json());
app.use('/brand', initializeRoutes());

describe('Brand Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testBrands: [
                {
                    id_brand: 'brand-1',
                    name: 'Nike'
                },
                {
                    id_brand: 'brand-2',
                    name: 'Adidas'
                },
                {
                    id_brand: 'brand-3',
                    name: 'New Balance'
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup des mocks par défaut
        Brand.create.mockImplementation((data) => Promise.resolve({ 
            id_brand: 'new-brand-id', 
            ...data 
        }));
        
        Brand.findAll.mockResolvedValue(mockTestData.testBrands);
        Brand.findByPk.mockResolvedValue(mockTestData.testBrands[0]);
        Brand.findOne.mockResolvedValue(null);
    });

    describe('POST /seeder', () => {
        it('should create brands successfully', async () => {
            // Mock pour créer 3 marques
            Brand.create
                .mockResolvedValueOnce(mockTestData.testBrands[0])
                .mockResolvedValueOnce(mockTestData.testBrands[1])
                .mockResolvedValueOnce(mockTestData.testBrands[2]);

            const response = await request(app)
                .post('/brand/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0].name).toBe('Nike');
            expect(response.body[1].name).toBe('Adidas');
            expect(response.body[2].name).toBe('New Balance');
            expect(Brand.create).toHaveBeenCalledTimes(3);
            expect(Brand.findAll).toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            Brand.create.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/brand/seeder');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during creation of brand');
        });
    });

    describe('GET /', () => {
        it('should return all brands successfully', async () => {
            const response = await request(app)
                .get('/brand');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0].name).toBe('Nike');
            expect(Brand.findAll).toHaveBeenCalled();
        });

        it('should return empty array if no brands exist', async () => {
            Brand.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/brand');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return 500 on database error', async () => {
            Brand.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/brand');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting of brands');
        });
    });

    describe('POST /', () => {
        it('should create a new brand successfully', async () => {
            const newBrand = {
                name: 'Puma'
            };

            const response = await request(app)
                .post('/brand')
                .send(newBrand);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('Puma');
            expect(Brand.findOne).toHaveBeenCalledWith({ where: { name: 'Puma' } });
            expect(Brand.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Puma'
            }));
        });

        it('should return existing brand if it already exists', async () => {
            Brand.findOne.mockResolvedValueOnce(mockTestData.testBrands[0]);

            const response = await request(app)
                .post('/brand')
                .send({ name: 'Nike' });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Nike');
            expect(Brand.create).not.toHaveBeenCalled();
        });

        it('should return 400 if name is missing', async () => {
            const response = await request(app)
                .post('/brand')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Brand name is required');
        });

        it('should return 500 on database error', async () => {
            Brand.findOne.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/brand')
                .send({ name: 'Test Brand' });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error creating brand');
        });
    });

    describe('GET /:id', () => {
        it('should return brand by id successfully', async () => {
            const response = await request(app)
                .get('/brand/brand-1');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Nike');
            expect(Brand.findByPk).toHaveBeenCalledWith('brand-1');
        });

        it('should return 404 if brand not found', async () => {
            Brand.findByPk.mockResolvedValueOnce(null);

            const response = await request(app)
                .get('/brand/non-existent-id');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Brand not found');
        });

        it('should return 500 on database error', async () => {
            Brand.findByPk.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/brand/brand-1');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching brand');
        });
    });
});
