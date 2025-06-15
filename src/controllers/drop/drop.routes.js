const express = require('express');
const router = express.Router();
const { Drop } = require('../../models/models/drop/drop.model');
const { v4: uuidv4 } = require('uuid');
const {Product} = require("../../models/models/product/product.model");
const DropRepository = require("../../models/repositories/drop/drop-repository");
const { Category } = require("../../models/models/product/category.model");
const { ProductImage } = require("../../models/models/product/product_image.model");
const { Image } = require("../../models/models/product/image.model");
const {Brand} = require("../../models/models/product/brand.model");
const {User} = require("../../models/models/user/user.model");

router.post('/seeder', async (req, res) => {
    try {
        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }
        const users = await User.findAll();

        const dropsToCreate = [
            {
                start_date: new Date('2025-02-15T00:00:00Z'),
                end_date: new Date('2025-02-22T23:59:59Z'),
                is_premium: false,
                id_product: products[0].id_product,
                id_vendor: users[0].id_user
            },
            {
                start_date: new Date('2025-03-01T00:00:00Z'),
                end_date: new Date('2025-03-07T23:59:59Z'),
                is_premium: true,
                id_product: products[1].id_product,
                id_vendor: users[1].id_user
            },
            {
                start_date: new Date('2025-04-10T00:00:00Z'),
                end_date: new Date('2025-04-17T23:59:59Z'),
                is_premium: false,
                id_product: products[2].id_product,
                id_vendor: users[2].id_user
            },
            {
                start_date: new Date('2025-05-10T00:00:00Z'),
                end_date: new Date('2025-06-17T23:59:59Z'),
                is_premium: false,
                id_product: products[2].id_product,
                id_vendor: users[2].id_user
            }
        ];

        for (let drop of dropsToCreate) {
            await Drop.create({
                start_date: drop.start_date,
                end_date: drop.end_date,
                is_premium: drop.is_premium,
                id_product: drop.id_product,
                id_vendor: drop.id_vendor,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Drop was created successfully: ${drop.start_date} - ${drop.end_date}`);
        }

        const drops = await Drop.findAll();

        res.status(200).send(drops);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding a drop', error: e.message });
    }
});

router.post('/', async (req, res) => {
    const { start_date, end_date, is_premium, id_product, id_vendor } = req.body;
    try {
        const drop = await Drop.create({
            id_vendor,
            start_date,
            end_date,
            is_premium,
            id_product,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        res.status(201).send(drop);
    } catch (e) {
        res.status(500).send({ message: 'Error creating drop', error: e.message });
    }
});


router.get('/:id/details', async (req, res) => {
    const { id } = req.params;

    try {
        const drop = await DropRepository.findDropDetails(id);

        if (!drop) {
            return res.status(404).json({ message: 'Drop not found' });
        }

        res.status(200).json(drop);
    } catch (error) {
        console.error('Error fetching drop:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


router.get('/vendor/:id_vendor', async (req, res) => {
    try {
        // Récupérer l'ID du vendeur depuis les paramètres de l'URL
        const vendorId = req.params.id_vendor;

        // Vérifier que l'ID est valide
        if (!vendorId) {
            return res.status(400).send({ message: 'Vendor ID is required' });
        }

        // Récupérer les drops avec les produits associés
        const drops = await Drop.findAll({
            where: { id_vendor: vendorId }, // Le filtre principal
            include: [
                {
                    model: Product,
                    attributes: ['name'],
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


        // Format the response to match frontend expectations
        const formattedDrops = drops.map(drop => {
            const product = drop.Product;
            const categoryName = product?.Category?.name || "N/A";
            const brandName = product?.Brand?.name || "N/A";

            const rawImage = product?.ProductImages?.[0]?.Image?.image;
            const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

            return {
                id_drop: drop.id_drop,
                id_product: drop.id_product,
                id_vendor: vendorId,
                start_date: drop.start_date,
                end_date: drop.end_date,
                is_prenium: drop.is_premium,
                // Informations du produit
                name: product.name,
                brand: brandName,
                category: categoryName,
                image: imageBase64 || "/placeholder.png",
                price: product.price,
                description: product.description
            }
        });

        res.status(200).send(formattedDrops);
    } catch (e) {
        console.error('Error getting vendor drops:', e);
        res.status(500).send({ message: 'Error getting vendor drops', error: e.message });
    }
});

// Mettre à jour un drop
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, is_premium, id_product } = req.body;

        console.log(id, start_date, end_date, is_premium, id_product);

        // Vérifier que le drop existe
        const drop = await Drop.findByPk(id);
        if (!drop) {
            return res.status(404).send({ message: 'Drop not found' });
        }

        // Vérifier que les données requises sont présentes
        if (!start_date || !end_date || !id_product) {
            return res.status(400).send({
                message: 'Missing required fields',
                details: 'start_date, end_date, and id_product are required'
            });
        }

        // Vérifier que le produit existe
        let product = await Product.findByPk(id_product);
        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        // Mettre à jour le drop
        await drop.update({
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            is_premium: is_premium !== undefined ? is_premium : drop.is_premium,
            id_product,
            updatedAt: new Date()
        });

        // Récupérer le drop mis à jour avec les informations du produit
        const updatedDrop = await Drop.findByPk(id, {
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
        let product_updated = updatedDrop.Product;
        const categoryName = product_updated?.Category?.name || "N/A";
        const brandName = product_updated?.Brand?.name || "N/A";

        const rawImage = product_updated?.ProductImages?.[0]?.Image?.image;
        const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

        const formattedDrop = {
            id_drop: updatedDrop.id_drop,
            id_product: updatedDrop.id_product,
            id_vendor: updatedDrop.id_vendor,
            start_date: updatedDrop.start_date,
            end_date: updatedDrop.end_date,
            is_prenium: updatedDrop.is_premium,
            // Informations du produit
            name: product_updated.name,
            brand: brandName,
            category: categoryName,
            image: imageBase64 || "/placeholder.png",
            price: product_updated.price,
            description: product_updated.description
        };

        res.status(200).send(formattedDrop);
    } catch (e) {
        console.error('Error updating drop:', e);
        res.status(500).send({
            message: 'Error updating drop',
            error: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Drop.destroy({ where: { id_drop: id } });
        res.status(204).send();
    } catch (e) {
        res.status(500).send({ message: 'Error deleting drop', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const drops = await Drop.findAll({
            include: {
                model: Product,
                include: [
                    {
                        model: Category,
                        attributes: ['name']
                    },
                    {
                        model: Brand,
                        attributes: ['name']
                    },
                    {
                        model: ProductImage,
                        include: {
                            model: Image,
                            attributes: ['image']
                        }
                    }
                ]
            }
        });

        const formattedDrops = drops.map(drop => {
            const product = drop.Product;
            const categoryName = product?.Category?.name || "N/A";
            const brandName = product?.Brand?.name || "N/A";

            const rawImage = product?.ProductImages?.[0]?.Image?.image;
            const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

            return {
                id: drop.id_drop,
                name: product.name,
                brand: brandName,
                category: categoryName,
                image: imageBase64 || "/placeholder.png",
                dropDate: drop.start_date,
                isVip: drop.is_premium
            }
        });

        res.status(200).send(formattedDrops);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during getting of all drops', error: e.message });
    }
});



router.get('/next', async (req, res) => {
    try {
        const drop = await DropRepository.findUpcomingDropWithProduct();

        if (!drop) {
            return res.status(404).json({ message: 'No upcoming drop found' });
        }
        res.status(200).json(drop);
    } catch (e) {
        console.error('Error fetching next drop:', e);
        res.status(500).json({
            message: 'Error while getting the next drop',
            error: e.message
        });
    }
});

router.get('/today', async (req, res) => {
    try {
        const drops = await DropRepository.findTodayDropsWithProductAndProject();

        if (!drops || drops.length === 0) {
            return res.status(404).json({ message: 'No drops found for today' });
        }

        res.status(200).json(drops);
    } catch (e) {
        console.error('Error fetching today\'s drops:', e);
        res.status(500).json({
            message: 'Error while getting today\'s drops',
            error: e.message
        });
    }
});


router.get('/category', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).send(categories);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting categories', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
