const express = require('express');
const router = express.Router();
const { Drop } = require('../../models/models/drop/drop.model');
const { v4: uuidv4 } = require('uuid');
const {Product} = require("../../models/models/product/product.model");
const DropRepository = require("../../models/repositories/drop/drop-repository");
const { Category } = require("../../models/models/product/category.model");
const { ProductImage } = require("../../models/models/product/product_image.model");
const { Image } = require("../../models/models/product/image.model");

router.post('/seeder', async (req, res) => {
    try {
        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }
        const dropsToCreate = [
            {
                start_date: new Date('2025-02-15T00:00:00Z'),
                end_date: new Date('2025-02-22T23:59:59Z'),
                is_premium: false,
                id_product: products[0].id_product
            },
            {
                start_date: new Date('2025-03-01T00:00:00Z'),
                end_date: new Date('2025-03-07T23:59:59Z'),
                is_premium: true,
                id_product: products[1].id_product
            },
            {
                start_date: new Date('2025-04-10T00:00:00Z'),
                end_date: new Date('2025-04-17T23:59:59Z'),
                is_premium: false,
                id_product: products[2].id_product
            },
            {
                start_date: new Date('2025-05-10T00:00:00Z'),
                end_date: new Date('2025-06-17T23:59:59Z'),
                is_premium: false,
                id_product: products[2].id_product
            }
        ];

        for (let drop of dropsToCreate) {
            await Drop.create({
                start_date: drop.start_date,
                end_date: drop.end_date,
                is_premium: drop.is_premium,
                id_product: drop.id_product,
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
    const { start_date, end_date, is_premium, id_product } = req.body;
    try {
        const drop = await Drop.create({
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

router.get('/vendor', async (req, res) => {
    const vendorId = req.user.id; // si auth middleware en place
    try {
        const drops = await Drop.findAll({
            include: {
                model: Product,
                where: { id_vendor: vendorId }
            }
        });
        res.status(200).send(drops);
    } catch (e) {
        res.status(500).send({ message: 'Error getting vendor drops', error: e.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Drop.update(req.body, { where: { id_drop: id } });
        const updatedDrop = await Drop.findByPk(id);
        res.status(200).send(updatedDrop);
    } catch (e) {
        res.status(500).send({ message: 'Error updating drop', error: e.message });
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
                        model: ProductImage,
                        include: {
                            model: Image,
                            attributes: ['image'] // BLOB
                        }
                    }
                ]
            }
        });

        const formattedDrops = drops.map(drop => {
            const product = drop.Product;
            const categoryName = product?.Category?.name || "Inconnu";

            const rawImage = product?.ProductImages?.[0]?.Image?.image;
            const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

            return {
                id: drop.id_drop,
                name: product.name,
                brand: "N/A", // pas dans tes données actuelles
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


module.exports = {
    initializeRoutes: () => router,
};
