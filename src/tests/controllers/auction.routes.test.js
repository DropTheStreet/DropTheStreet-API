const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/auction/auction.routes');
const AuctionRepository = require('../../models/repositories/auction/auction-repository');

// Mock de tous les modèles Sequelize
jest.mock('../../models/mysql.db', () => ({
    sequelize: {
        sync: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue()
    }
}));

jest.mock('../../models/models/auction/auction.model', () => ({
    Auction: {
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
jest.mock('../../models/repositories/auction/auction-repository');

const { Auction } = require('../../models/models/auction/auction.model');
const { Product } = require('../../models/models/product/product.model');
const { User } = require('../../models/models/user/user.model');

const app = express();
app.use(express.json());
app.use('/auctions', initializeRoutes());

describe('Auction Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testUser: {
                id_user: 'user-123',
                pseudo: 'testuser',
                email: 'test@example.com'
            },
            testProduct: {
                id_product: 'product-123',
                name: 'Test Product',
                description: 'Test Description'
            },
            testAuction: {
                id_auction: 'auction-123',
                initial_price: 1000,
                actual_price: 1500,
                size: 'M',
                start_date: '2025-07-01T10:00:00Z',
                end_date: '2025-07-07T10:00:00Z',
                id_product: 'product-123',
                id_user: 'user-123'
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
        
        Auction.create.mockImplementation((data) => Promise.resolve({ 
            id_auction: 'new-auction-id', 
            ...data 
        }));
        
        Auction.findAll.mockResolvedValue([mockTestData.testAuction]);
        Auction.findByPk.mockResolvedValue(mockTestData.testAuction);
        Product.findByPk.mockResolvedValue(mockTestData.testProduct);
    });

    describe('POST /seeder', () => {
        it('should create test auctions successfully', async () => {
            const response = await request(app)
                .post('/auctions/seeder');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(Auction.create).toHaveBeenCalledTimes(3);
        });

        it('should return 400 if not enough products', async () => {
            Product.findAll.mockResolvedValueOnce([
                { id_product: 'product-1', name: 'Product 1' }
            ]);

            const response = await request(app)
                .post('/auctions/seeder');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Not enough products for seeding');
        });

        it('should return 400 if not enough users', async () => {
            User.findAll.mockResolvedValueOnce([
                { id_user: 'user-1', pseudo: 'user1' }
            ]);

            const response = await request(app)
                .post('/auctions/seeder');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Not enough users for seeding');
        });
    });

    describe('GET /', () => {
        it('should return all auctions successfully', async () => {
            const response = await request(app)
                .get('/auctions');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(Auction.findAll).toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            Auction.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/auctions');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error during getting of all auctions');
        });
    });

    describe('POST /create', () => {
        it('should create auction successfully using repository', async () => {
            const auctionData = {
                initial_price: 1000,
                actual_price: 1200,
                size: 'L',
                start_date: '2025-08-01T10:00:00Z',
                end_date: '2025-08-07T10:00:00Z',
                id_product: mockTestData.testProduct.id_product,
                id_user: mockTestData.testUser.id_user
            };

            AuctionRepository.create.mockResolvedValue({
                id_auction: 'new-auction-id',
                ...auctionData
            });

            const response = await request(app)
                .post('/auctions/create')
                .send(auctionData);

            expect(response.status).toBe(201);
            expect(AuctionRepository.create).toHaveBeenCalledWith(auctionData);
        });

        it('should return 500 on repository error', async () => {
            AuctionRepository.create.mockRejectedValueOnce(new Error('Repository error'));

            const response = await request(app)
                .post('/auctions/create')
                .send({
                    initial_price: 1000,
                    size: 'M'
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error creating auction');
        });
    });

    describe('GET /active', () => {
        it('should return active auctions successfully', async () => {
            const mockActiveAuctions = [
                {
                    id_auction: 'active-1',
                    end_date: new Date(Date.now() + 86400000), // Tomorrow
                    Product: { name: 'Active Product' }
                }
            ];

            AuctionRepository.findActiveAuctions.mockResolvedValue(mockActiveAuctions);

            const response = await request(app)
                .get('/auctions/active');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(AuctionRepository.findActiveAuctions).toHaveBeenCalled();
        });

        it('should return 500 on repository error', async () => {
            AuctionRepository.findActiveAuctions.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/auctions/active');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching active auctions');
        });
    });

    describe('GET /:id', () => {
        it('should return auction by id successfully', async () => {
            AuctionRepository.findById.mockResolvedValue(mockTestData.testAuction);

            const response = await request(app)
                .get(`/auctions/${mockTestData.testAuction.id_auction}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockTestData.testAuction);
            expect(AuctionRepository.findById).toHaveBeenCalledWith(mockTestData.testAuction.id_auction);
        });

        it('should return 404 if auction not found', async () => {
            AuctionRepository.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/auctions/non-existent-id');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Auction not found');
        });

        it('should return 500 on repository error', async () => {
            AuctionRepository.findById.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get(`/auctions/${mockTestData.testAuction.id_auction}`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching auction');
        });
    });

    describe('GET /:id/details', () => {
        it('should return auction details successfully', async () => {
            const mockAuctionDetails = {
                ...mockTestData.testAuction,
                Product: {
                    name: 'Test Product',
                    Category: { name: 'Test Category' },
                    Brand: { name: 'Test Brand' }
                }
            };

            AuctionRepository.findByIdWithDetails.mockResolvedValue(mockAuctionDetails);

            const response = await request(app)
                .get(`/auctions/${mockTestData.testAuction.id_auction}/details`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockAuctionDetails);
            expect(AuctionRepository.findByIdWithDetails).toHaveBeenCalledWith(mockTestData.testAuction.id_auction);
        });

        it('should return 404 if auction not found', async () => {
            AuctionRepository.findByIdWithDetails.mockResolvedValue(null);

            const response = await request(app)
                .get('/auctions/non-existent-id/details');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Auction not found');
        });
    });

    describe('PUT /update/:id', () => {
        it('should update auction successfully using repository', async () => {
            const updateData = {
                initial_price: 1500,
                actual_price: 1800,
                size: 'XL'
            };

            const updatedAuction = {
                ...mockTestData.testAuction,
                ...updateData
            };

            AuctionRepository.update.mockResolvedValue(updatedAuction);

            const response = await request(app)
                .put(`/auctions/update/${mockTestData.testAuction.id_auction}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(updatedAuction);
            expect(AuctionRepository.update).toHaveBeenCalledWith(mockTestData.testAuction.id_auction, updateData);
        });

        it('should return 500 on repository error', async () => {
            AuctionRepository.update.mockRejectedValueOnce(new Error('Update error'));

            const response = await request(app)
                .put('/auctions/update/some-id')
                .send({ initial_price: 1500 });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error updating auction');
        });
    });

    describe('GET /seller/:id_user', () => {
        it('should return auctions by seller successfully', async () => {
            const mockSellerAuctions = [
                {
                    id_auction: 'seller-auction-1',
                    id_user: mockTestData.testUser.id_user,
                    Product: { name: 'Seller Product' }
                }
            ];

            AuctionRepository.findBySellerId.mockResolvedValue(mockSellerAuctions);

            const response = await request(app)
                .get(`/auctions/seller/${mockTestData.testUser.id_user}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(AuctionRepository.findBySellerId).toHaveBeenCalledWith(mockTestData.testUser.id_user);
        });

        it('should return 500 on repository error', async () => {
            AuctionRepository.findBySellerId.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/auctions/seller/some-user-id');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching auctions by user');
        });
    });

    describe('DELETE /delete/:id', () => {
        it('should delete auction successfully', async () => {
            AuctionRepository.delete.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/auctions/delete/${mockTestData.testAuction.id_auction}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Auction deleted');
            expect(response.body.success).toBe(true);
            expect(AuctionRepository.delete).toHaveBeenCalledWith(mockTestData.testAuction.id_auction);
        });

        it('should return 500 on repository error', async () => {
            AuctionRepository.delete.mockRejectedValueOnce(new Error('Delete error'));

            const response = await request(app)
                .delete('/auctions/delete/some-id');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error deleting auction');
        });
    });

    describe('POST /add', () => {
        const validAuctionData = {
            initial_price: 1000,
            actual_price: 1200,
            start_date: '2025-08-01T10:00:00Z',
            end_date: '2025-08-07T10:00:00Z',
            size: 'M'
        };

        it('should create auction successfully using direct model', async () => {
            const auctionData = {
                ...validAuctionData,
                id_product: mockTestData.testProduct.id_product,
                id_user: mockTestData.testUser.id_user
            };

            const response = await request(app)
                .post('/auctions/add')
                .send(auctionData);

            expect(response.status).toBe(201);
            expect(Auction.create).toHaveBeenCalledWith(expect.objectContaining({
                initial_price: auctionData.initial_price,
                actual_price: auctionData.actual_price,
                size: auctionData.size,
                id_product: auctionData.id_product,
                id_user: auctionData.id_user
            }));
        });

        it('should return 500 on database error', async () => {
            Auction.create.mockRejectedValueOnce(new Error('Database error'));

            const auctionData = {
                ...validAuctionData,
                id_product: mockTestData.testProduct.id_product,
                id_user: mockTestData.testUser.id_user
            };

            const response = await request(app)
                .post('/auctions/add')
                .send(auctionData);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error creating auction');
        });
    });

    // Note: La route PUT /update/:id utilise le repository (première définition)
    // Les tests pour cette route sont déjà couverts dans la section "PUT /update/:id" ci-dessus
});
