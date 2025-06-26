const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/category/category.routes');

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

jest.mock('../../models/models/product/category.model', () => ({
    Category: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

const { Category } = require('../../models/models/product/category.model');

const app = express();
app.use(express.json());
app.use('/category', initializeRoutes());

describe('Category Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testCategories: [
                {
                    id_category: 'category-1',
                    name: 'Sneakers'
                },
                {
                    id_category: 'category-2',
                    name: 'Clothing'
                },
                {
                    id_category: 'category-3',
                    name: 'Accessories'
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup des mocks par défaut
        Category.create.mockImplementation((data) => Promise.resolve({ 
            id_category: 'new-category-id', 
            ...data 
        }));
        
        Category.findAll.mockResolvedValue(mockTestData.testCategories);
        Category.findByPk.mockResolvedValue(mockTestData.testCategories[0]);
        Category.findOne.mockResolvedValue(null);
    });

    describe('GET /', () => {
        it('should return all categories successfully', async () => {
            const response = await request(app)
                .get('/category');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0].name).toBe('Sneakers');
            expect(Category.findAll).toHaveBeenCalledWith({
                order: [['name', 'ASC']]
            });
        });

        it('should return empty array if no categories exist', async () => {
            Category.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/category');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return 500 on database error', async () => {
            Category.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/category');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching categories');
        });
    });

    describe('POST /', () => {
        it('should create a new category successfully', async () => {
            const newCategory = {
                name: 'New Category'
            };

            const response = await request(app)
                .post('/category')
                .send(newCategory);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('New Category');
            expect(Category.findOne).toHaveBeenCalledWith({ where: { name: 'New Category' } });
            expect(Category.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'New Category'
            }));
        });

        it('should return existing category if it already exists', async () => {
            Category.findOne.mockResolvedValueOnce(mockTestData.testCategories[0]);

            const response = await request(app)
                .post('/category')
                .send({ name: 'Sneakers' });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Sneakers');
            expect(Category.create).not.toHaveBeenCalled();
        });

        it('should return 400 if name is missing', async () => {
            const response = await request(app)
                .post('/category')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Category name is required');
        });

        it('should return 500 on database error', async () => {
            Category.findOne.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/category')
                .send({ name: 'Test Category' });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error creating category');
        });
    });

    describe('GET /:id', () => {
        it('should return category by id successfully', async () => {
            const response = await request(app)
                .get('/category/category-1');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Sneakers');
            expect(Category.findByPk).toHaveBeenCalledWith('category-1');
        });

        it('should return 404 if category not found', async () => {
            Category.findByPk.mockResolvedValueOnce(null);

            const response = await request(app)
                .get('/category/non-existent-id');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Category not found');
        });

        it('should return 500 on database error', async () => {
            Category.findByPk.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/category/category-1');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching category');
        });
    });
});
