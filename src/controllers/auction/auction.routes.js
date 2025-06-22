const express = require('express');
const router = express.Router();
const { Auction } = require('../../models/models/auction/auction.model');
const { v4: uuidv4 } = require('uuid');
const {User} = require("../../models/models/user/user.model");
const {Product} = require("../../models/models/product/product.model");
const AuctionRepository  = require("../../models/repositories/auction/auction-repository");
const {Category} = require("../../models/models/product/category.model");
const {Brand} = require("../../models/models/product/brand.model");
const {ProductImage} = require("../../models/models/product/product_image.model");

router.post('/seeder', async (req, res) => {
    try {

        const users = await User.findAll();
        if (users.length < 3) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }

        const auctions = [
            {
                initial_price: 1000,
                actual_price: 1500,
                size: 'M',
                start_date: new Date('2025-06-19T10:00:00Z'),
                end_date: new Date('2025-06-25T10:00:00Z'),
                id_product: products[0].id_product,
                id_user: users[0].id_user
            },
            {
                initial_price: 500,
                actual_price: 750,
                size: 'L',
                start_date: new Date('2025-07-11T12:00:00Z'),
                end_date: new Date('2025-07-17T12:00:00Z'),
                id_product: products[1].id_product,
                id_user: users[1].id_user
            },
            {
                initial_price: 2000,
                actual_price: 2500,
                size: 'S',
                start_date: new Date('2025-06-19T15:00:00Z'),
                end_date: new Date('2025-07-20T15:00:00Z'),
                id_product: products[2].id_product,
                id_user: users[2].id_user
            },
        ];

        for (let auction of auctions) {
            await Auction.create({
                id_auction: uuidv4(),
                initial_price: auction.initial_price,
                actual_price: auction.actual_price,
                size: auction.size,
                start_date: auction.start_date,
                end_date: auction.end_date,
                id_product: auction.id_product,
                id_user: auction.id_user
            });
            console.log(`Auction was added successfully ${auction.initial_price}`);
        }

        const allAuctions = await Auction.findAll();

        res.status(200).send(allAuctions);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of auction', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const auctions = await Auction.findAll();
        res.status(200).send(auctions);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of all auctions', error: e.message });
    }
});

router.post('/create', async (req, res) => {
    try {
        const auction = await AuctionRepository.create(req.body);
        res.status(201).json(auction);
    } catch (e) {
        res.status(500).json({ message: 'Error creating auction', error: e.message });
    }
});

router.get('/active', async (req, res) => {
    try {
        const activeAuctions = await AuctionRepository.findActiveAuctions();
        res.status(200).json(activeAuctions);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching active auctions', error: e.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const auction = await AuctionRepository.findById(req.params.id);
        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }
        res.status(200).json(auction);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching auction', error: e.message });
    }
});

router.get('/:id/details', async (req, res) => {
    try {
        const auction = await AuctionRepository.findByIdWithDetails(req.params.id);
        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }
        res.status(200).json(auction);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching auction', error: e.message });
    }
});

router.put('/update/:id', async (req, res) => {
    try {
        const updated = await AuctionRepository.update(req.params.id, req.body);
        res.status(200).json(updated);
    } catch (e) {
        res.status(500).json({ message: 'Error updating auction', error: e.message });
    }
});

router.get('/seller/:id_user', async (req, res) => {
    try {
        const { id_user } = req.params;
        const auctions = await AuctionRepository.findBySellerId(id_user);
        res.status(200).json(auctions);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching auctions by user', error: e.message });
    }
});


router.delete('/delete/:id', async (req, res) => {
    try {
        const deleted = await AuctionRepository.delete(req.params.id);
        res.status(200).json({ message: 'Auction deleted', success: deleted });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting auction', error: e.message });
    }
});

router.post('/add', async (req, res) => {
    const { initial_price, actual_price, start_date, end_date, id_product, id_user, size } = req.body;
    try {
        const auction = await Auction.create({
            initial_price,
            actual_price,
            size,
            start_date,
            end_date,
            id_product,
            id_user,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        res.status(201).send(auction);
    } catch (e) {
        res.status(500).send({ message: 'Error creating auction', error: e.message });
    }
});

// Mettre à jour une enchère
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { initial_price, actual_price, size, start_date, end_date, id_product } = req.body;

        console.log(id, initial_price, actual_price, size, start_date, end_date, id_product);

        // Vérifier que l'enchère existe
        const auction = await Auction.findByPk(id);
        if (!auction) {
            return res.status(404).send({ message: 'Auction not found' });
        }

        // Vérifier que les données requises sont présentes
        if (!initial_price || !start_date || !end_date || !id_product || !size) {
            return res.status(400).send({
                message: 'Missing required fields',
                details: 'initial_price, start_date, end_date, size and id_product are required'
            });
        }

        // Vérifier que le produit existe
        let product = await Product.findByPk(id_product);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        // Mettre à jour l'enchère
        await auction.update({
            initial_price,
            actual_price: actual_price !== undefined ? actual_price : auction.actual_price,
            size,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            id_product,
            updatedAt: new Date()
        });

        // Récupérer l'enchère mise à jour avec les informations du produit
        const updatedAuction = await Auction.findByPk(id, {
            include: [
                {
                    model: Product,
                    include: [
                        { model: Category, attributes: ['name'] },
                        { model: Brand, attributes: ['name'] },
                        {
                            model: ProductImage,
                            include: [
                                { model: Image, attributes: ['image'] }
                            ]
                        }
                    ]
                }
            ]
        });

        // Formater la réponse pour le frontend
        let product_updated = updatedAuction.Product;
        const categoryName = product_updated?.Category?.name || "N/A";
        const brandName = product_updated?.Brand?.name || "N/A";

        const rawImage = product_updated?.ProductImages?.[0]?.Image?.image;
        const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

        const formattedAuction = {
            id_auction: updatedAuction.id_auction,
            id_product: updatedAuction.id_product,
            id_user: updatedAuction.id_user,
            initial_price: updatedAuction.initial_price,
            actual_price: updatedAuction.actual_price,
            size: updatedAuction.size,
            start_date: updatedAuction.start_date,
            end_date: updatedAuction.end_date,
            // Informations du produit
            name: product_updated.name,
            brand: brandName,
            category: categoryName,
            image: imageBase64 || "/placeholder.svg",
            price: product_updated.price,
            description: product_updated.description
        };

        res.status(200).send(formattedAuction);
    } catch (e) {
        console.error('Error updating auction:', e);
        res.status(500).send({
            message: 'Error updating auction',
            error: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
