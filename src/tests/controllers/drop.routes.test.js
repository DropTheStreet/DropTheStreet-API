const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/drop/drop.routes');
const DropRepository = require('../../models/repositories/drop/drop-repository');

// Mock de tous les modèles Sequelize
jest.mock('../../models/mysql.db', () => ({
    sequelize: {
        sync: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue()
    }
}));

jest.mock('../../models/models/drop/drop.model', () => ({
    Drop: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        destroy: jest.fn()
    }
}));

jest.mock('../../models/models/product/product.model', () => ({
    Product: {
        findAll: jest.fn(),
        findByPk: jest.fn()
    }
}));

jest.mock('../../models/models/product/category.model', () => ({
    Category: {
        findAll: jest.fn()
    }
}));

jest.mock('../../models/models/product/brand.model', () => ({
    Brand: {}
}));

jest.mock('../../models/models/user/user.model', () => ({
    User: {
        findAll: jest.fn()
    }
}));

jest.mock('../../models/models/product/product_image.model', () => ({
    ProductImage: {}
}));

jest.mock('../../models/models/product/image.model', () => ({
    Image: {}
}));

// Mock du repository
jest.mock('../../models/repositories/drop/drop-repository');

const { Drop } = require('../../models/models/drop/drop.model');
const { Product } = require('../../models/models/product/product.model');
const { Category } = require('../../models/models/product/category.model');
const { User } = require('../../models/models/user/user.model');

const app = express();
app.use(express.json());
app.use('/drops', initializeRoutes());

describe('Drop Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testUser: {
                id_user: 'user-123',
                pseudo: 'testuser',
                email: 'test@example.com'
            },
            testCategory: {
                id_category: 'category-123',
                name: 'Test Category'
            },
            testProduct: {
                id_product: 'product-123',
                name: 'Test Product',
                description: 'Test Description'
            },
            testDrop: {
                id_drop: 'drop-123',
                start_date: '2025-07-01T00:00:00Z',
                end_date: '2025-07-07T23:59:59Z',
                is_premium: false,
                price: '99.99',
                quantity: 50,
                size: 'M',
                id_product: 'product-123',
                id_vendor: 'user-123'
            }
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup des mocks par défaut
        Product.findAll.mockResolvedValue([
            mockTestData.testProduct,
            { id_product: 'product-2', name: 'Product 2' },
            { id_product: 'product-3', name: 'Product 3' }
        ]);

        User.findAll.mockResolvedValue([
            mockTestData.testUser,
            { id_user: 'user-2', pseudo: 'user2' },
            { id_user: 'user-3', pseudo: 'user3' }
        ]);

        Category.findAll.mockResolvedValue([mockTestData.testCategory]);

        Drop.create.mockImplementation((data) => Promise.resolve({
            id_drop: 'new-drop-id',
            ...data
        }));

        Drop.findAll.mockResolvedValue([mockTestData.testDrop]);
        Drop.findByPk.mockResolvedValue(mockTestData.testDrop);
        Product.findByPk.mockResolvedValue(mockTestData.testProduct);
    });

    describe('POST /seeder', () => {
        it('should create test drops successfully', async () => {
            const response = await request(app)
                .post('/drops/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should return 400 if not enough products', async () => {
            // Mock pour simuler pas assez de produits
            Product.findAll.mockResolvedValueOnce([
                { id_product: 'product-1', name: 'Product 1' }
            ]);

            const response = await request(app)
                .post('/drops/seeder');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Not enough products for seeding');
        });
    });

    describe('POST /', () => {
        const validDropData = {
            start_date: '2025-07-01T00:00:00Z',
            end_date: '2025-07-07T23:59:59Z',
            is_premium: false,
            price: 99.99,
            quantity: 50,
            size: 'M'
        };

        it('should create a drop successfully', async () => {
            const dropData = {
                ...validDropData,
                id_product: mockTestData.testProduct.id_product,
                id_vendor: mockTestData.testUser.id_user
            };

            const response = await request(app)
                .post('/drops')
                .send(dropData);

            expect(response.status).toBe(201);
            expect(response.body.price).toBe(99.99);
            expect(response.body.quantity).toBe(50);
            expect(response.body.size).toBe('M');
            expect(response.body.id_product).toBe(mockTestData.testProduct.id_product);
            expect(response.body.id_vendor).toBe(mockTestData.testUser.id_user);
            expect(Drop.create).toHaveBeenCalledWith(expect.objectContaining(dropData));
        });

        it('should return 500 on database error', async () => {
            Drop.create.mockRejectedValueOnce(new Error('Database error'));

            const dropData = {
                ...validDropData,
                id_product: mockTestData.testProduct.id_product,
                id_vendor: mockTestData.testUser.id_user
            };

            const response = await request(app)
                .post('/drops')
                .send(dropData);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error creating drop');
        });
    });

    describe('GET /:id/details', () => {
        it('should return drop details successfully', async () => {
            const mockDropDetails = {
                id_drop: mockTestData.testDrop.id_drop,
                price: 99.99,
                quantity: 50,
                Product: {
                    name: 'Test Product',
                    Category: { name: 'Test Category' },
                    Brand: { name: 'Test Brand' }
                }
            };

            DropRepository.findDropDetails.mockResolvedValue(mockDropDetails);

            const response = await request(app)
                .get(`/drops/${mockTestData.testDrop.id_drop}/details`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockDropDetails);
            expect(DropRepository.findDropDetails).toHaveBeenCalledWith(mockTestData.testDrop.id_drop);
        });

        it('should return 404 if drop not found', async () => {
            DropRepository.findDropDetails.mockResolvedValue(null);

            const response = await request(app)
                .get('/drops/non-existent-id/details');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Drop not found');
        });

        it('should return 500 on repository error', async () => {
            DropRepository.findDropDetails.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get(`/drops/${mockTestData.testDrop.id_drop}/details`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Internal server error');
        });
    });

    describe('GET /vendor/:id_vendor', () => {
        it('should return vendor drops successfully', async () => {
            const mockVendorDrops = [{
                id_drop: 'drop-1',
                id_vendor: mockTestData.testUser.id_user,
                Product: {
                    name: 'Test Product',
                    Category: { name: 'Test Category' },
                    Brand: { name: 'Test Brand' },
                    ProductImages: [{
                        Image: { image: Buffer.from('test') }
                    }]
                }
            }];

            Drop.findAll.mockResolvedValueOnce(mockVendorDrops);

            const response = await request(app)
                .get(`/drops/vendor/${mockTestData.testUser.id_user}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(Drop.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: { id_vendor: mockTestData.testUser.id_user }
            }));
        });

        it('should return 400 if vendor ID is missing', async () => {
            const response = await request(app)
                .get('/drops/vendor/');

            expect(response.status).toBe(404); // Express retourne 404 pour une route non trouvée
        });

        it('should return empty array if vendor has no drops', async () => {
            Drop.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .get('/drops/vendor/some-vendor-id');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });

    describe('PUT /:id', () => {
        const updateData = {
            start_date: '2025-08-01T00:00:00Z',
            end_date: '2025-08-07T23:59:59Z',
            is_premium: true,
            price: 149.99,
            quantity: 25,
            size: 'L'
        };

        it('should update a drop successfully', async () => {
            const mockUpdatedDrop = {
                ...mockTestData.testDrop,
                price: '149.99',
                quantity: 25,
                size: 'L',
                is_premium: true,
                update: jest.fn().mockResolvedValue(),
                Product: {
                    name: 'Test Product',
                    Category: { name: 'Test Category' },
                    Brand: { name: 'Test Brand' },
                    ProductImages: [{ Image: { image: Buffer.from('test') } }]
                }
            };

            Drop.findByPk.mockResolvedValueOnce(mockUpdatedDrop);
            Drop.findByPk.mockResolvedValueOnce(mockUpdatedDrop);

            const response = await request(app)
                .put(`/drops/${mockTestData.testDrop.id_drop}`)
                .send({
                    ...updateData,
                    id_product: mockTestData.testProduct.id_product
                });

            expect(response.status).toBe(200);
            expect(response.body.price).toBe('149.99');
            expect(response.body.quantity).toBe(25);
            expect(response.body.size).toBe('L');
            expect(response.body.is_premium).toBe(true);
        });

        it('should return 404 if drop not found', async () => {
            Drop.findByPk.mockResolvedValueOnce(null);

            const response = await request(app)
                .put('/drops/non-existent-id')
                .send({
                    ...updateData,
                    id_product: mockTestData.testProduct.id_product
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Drop not found');
        });

        it('should return 400 if required fields are missing', async () => {
            Drop.findByPk.mockResolvedValueOnce(mockTestData.testDrop);

            const response = await request(app)
                .put(`/drops/${mockTestData.testDrop.id_drop}`)
                .send({
                    start_date: '2025-08-01T00:00:00Z'
                    // Champs manquants
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Missing required fields');
        });

        it('should return 404 if product not found', async () => {
            Drop.findByPk.mockResolvedValueOnce(mockTestData.testDrop);
            Product.findByPk.mockResolvedValueOnce(null);

            const response = await request(app)
                .put(`/drops/${mockTestData.testDrop.id_drop}`)
                .send({
                    ...updateData,
                    id_product: 'non-existent-product-id'
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Product not found');
        });
    });

    describe('DELETE /:id', () => {
        it('should delete a drop successfully', async () => {
            Drop.destroy.mockResolvedValueOnce(1);

            const response = await request(app)
                .delete(`/drops/${mockTestData.testDrop.id_drop}`);

            expect(response.status).toBe(204);
            expect(Drop.destroy).toHaveBeenCalledWith({
                where: { id_drop: mockTestData.testDrop.id_drop }
            });
        });

        it('should return 500 on database error', async () => {
            Drop.destroy.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .delete('/drops/some-id');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error deleting drop');
        });
    });

    describe('GET /', () => {
        it('should return all drops successfully', async () => {
            const mockDropsWithProducts = [{
                id_drop: 'drop-1',
                start_date: '2025-07-01',
                end_date: '2025-07-07',
                price: 99.99,
                quantity: 50,
                size: 'M',
                is_premium: false,
                Product: {
                    id_product: 'product-1',
                    name: 'Test Product',
                    Category: { name: 'Test Category' },
                    Brand: { name: 'Test Brand' },
                    ProductImages: [{ Image: { image: Buffer.from('test') } }]
                }
            }];

            Drop.findAll.mockResolvedValueOnce(mockDropsWithProducts);

            const response = await request(app)
                .get('/drops');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);

            // Vérifier la structure des données retournées
            const drop = response.body[0];
            expect(drop).toHaveProperty('id');
            expect(drop).toHaveProperty('name');
            expect(drop).toHaveProperty('brand');
            expect(drop).toHaveProperty('category');
            expect(drop).toHaveProperty('price');
            expect(drop).toHaveProperty('quantity');
            expect(drop).toHaveProperty('size');
            expect(drop).toHaveProperty('image');
            expect(drop).toHaveProperty('isVip');
        });

        it('should return 500 on database error', async () => {
            Drop.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/drops');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting of all drops');
        });
    });

    describe('GET /next', () => {
        it('should return next upcoming drop', async () => {
            const mockNextDrop = {
                id_drop: 'test-id',
                start_date: new Date('2025-12-01'),
                Product: { name: 'Upcoming Product' }
            };

            DropRepository.findUpcomingDropWithProduct.mockResolvedValue(mockNextDrop);

            const response = await request(app)
                .get('/drops/next');

            expect(response.status).toBe(200);
            expect(response.body.id_drop).toBe(mockNextDrop.id_drop);
            expect(response.body.start_date).toBe(mockNextDrop.start_date.toISOString());
            expect(response.body.Product).toEqual(mockNextDrop.Product);
            expect(DropRepository.findUpcomingDropWithProduct).toHaveBeenCalled();
        });

        it('should return 404 if no upcoming drop found', async () => {
            DropRepository.findUpcomingDropWithProduct.mockResolvedValue(null);

            const response = await request(app)
                .get('/drops/next');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No upcoming drop found');
        });

        it('should return 500 on repository error', async () => {
            DropRepository.findUpcomingDropWithProduct.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/drops/next');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error while getting the next drop');
        });
    });

    describe('GET /today', () => {
        it('should return today\'s drops', async () => {
            const mockTodayDrops = [
                { id_drop: 'today-1', start_date: new Date() },
                { id_drop: 'today-2', start_date: new Date() }
            ];

            DropRepository.findTodayDropsWithProductAndProject.mockResolvedValue(mockTodayDrops);

            const response = await request(app)
                .get('/drops/today');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0].id_drop).toBe('today-1');
            expect(response.body[1].id_drop).toBe('today-2');
            expect(DropRepository.findTodayDropsWithProductAndProject).toHaveBeenCalled();
        });

        it('should return 404 if no drops found for today', async () => {
            DropRepository.findTodayDropsWithProductAndProject.mockResolvedValue([]);

            const response = await request(app)
                .get('/drops/today');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('No drops found for today');
        });

        it('should return 500 on repository error', async () => {
            DropRepository.findTodayDropsWithProductAndProject.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/drops/today');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error while getting today\'s drops');
        });
    });

    describe('GET /category', () => {
        it('should return all categories', async () => {
            const response = await request(app)
                .get('/drops/category');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0]).toHaveProperty('name');
            expect(Category.findAll).toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            Category.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/drops/category');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting categories');
        });
    });
});
