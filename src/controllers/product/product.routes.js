const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Product } = require('../../models/models/product/product.model');
const { v4: uuidv4 } = require('uuid');
const {Category} = require("../../models/models/product/category.model");
const {Brand} = require("../../models/models/product/brand.model");
const {ProductImage} = require("../../models/models/product/product_image.model");
const ProductRepository = require("../../models/repositories/product/product-repository");
const {Image} = require("../../models/models/product/image.model");

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limite de 5MB par fichier
        files: 10 // Maximum 10 fichiers
    },
    fileFilter: (req, file, cb) => {
        // Vérifier que c'est bien une image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

router.post('/seeder', async (req, res) => {
    try {
        const categories = await Category.findAll();
        if (categories.length < 3) {
            return res.status(400).send({ message: 'Not enough categories for seeding' });
        }

        const brands = await Brand.findAll();
        if (brands.length < 3) {
            return res.status(400).send({ message: 'Not enough brands for seeding' });
        }

        const productsToCreate = [
            {
                name: 'Produit 1',
                description: 'Description du produit 1',
                price: 19.99,
                image: null,
                quantity: 100,
                id_category: categories[0].id_category,
                id_brand: brands[0].id_brand,
            },
            {
                name: 'Produit 2',
                description: 'Description du produit 2',
                price: 29.99,
                image: null,
                quantity: 50,
                id_category: categories[1].id_category,
                id_brand: brands[1].id_brand,
            },
            {
                name: 'Produit 3',
                description: 'Description du produit 3',
                price: 39.99,
                image: null,
                quantity: 200,
                id_category: categories[2].id_category,
                id_brand: brands[2].id_brand,
            }
        ];

        for (let product of productsToCreate) {
            await Product.create({
                id_product_favorite: uuidv4(),
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image,
                quantity: product.quantity,
                id_category: product.id_category,
                id_brand: product.id_brand,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`Produit "${product.name}" ajouté avec succès.`);
        }

        const products = await Product.findAll({ order: [['name', 'ASC']] });

        res.status(200).send(products);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Erreur lors de l’ajout des produits', error: e.message });
    }
});

router.get('/popular', async (req, res) => {
    try {
        const popularProducts = await ProductRepository.findTop3ByQuantity();
        res.status(200).send(popularProducts);
    } catch (error) {
        console.error('Erreur lors de la récupération des produits populaires :', error);
        res.status(500).send({ message: 'Erreur serveur', error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const products = await Product.findAll({
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
                ],
            order: [['name', 'ASC']]
        });
        res.status(200).send(products);
    } catch (e) {
        console.error('Error fetching products:', e);
        res.status(500).send({ message: 'Error fetching products', error: e.message });
    }
});

// Récupérer les produits d'un vendeur
router.get('/vendor/:id_vendor', async (req, res) => {
    try {
        // Récupérer l'ID du vendeur à partir du token
        const vendorId = req.params.id_vendor;

        // Récupérer les produits du vendeur
        const products = await Product.findAll({
            include: [
                { model: Category, attributes: ['name'] },
                { model: Brand, attributes: ['name'] },
                {
                    model: ProductImage,
                    include: [
                        { model: Image, attributes: ['image'] }
                    ]
                }
            ],
            order: [['name', 'ASC']]
        });

        console.log(products)

        // Formater les produits pour le frontend
        const formattedProducts = products.map(product => {
            const rawImage = product.ProductImages && product.ProductImages[0]?.Image?.image;
            const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

            return {
                id_product: product.id_product,
                name: product.name,
                price: product.price,
                description: product.description,
                quantity: product.quantity,
                id_category: product.id_category,
                id_brand: product.id_brand,
                category: product.Category?.name || 'N/A',
                brand: product.Brand?.name || 'N/A',
                image: imageBase64 || "/placeholder.png"
            };
        });

        res.status(200).send(formattedProducts);
    } catch (e) {
        console.error('Error fetching vendor products:', e);
        res.status(500).send({ message: 'Error fetching vendor products', error: e.message });
    }
});

// Créer un nouveau produit
router.post('/', async (req, res) => {
    try {
        const { id_user, name, id_category, id_brand, price, quantity, description } = req.body;

        // Récupérer l'ID du vendeur à partir du token
        const vendorId = id_user;

        if (!name || !id_category || !id_brand) {
            return res.status(400).send({ message: 'Name, category and brand are required' });
        }

        console.log(vendorId, name, id_category, id_brand, price, quantity, description);
        // Créer un nouveau produit
        const newProduct = await Product.create({
            id_product: uuidv4(), // Générer un UUID pour l'ID du produit
            name,
            id_category,
            id_brand,
            price: price || 0,
            quantity: quantity || 1,
            description: description || '',
            id_vendor: vendorId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Récupérer le produit avec ses relations pour le retourner
        const product = await Product.findByPk(newProduct.id_product, {
            include: [
                { model: Category, attributes: ['name'] },
                { model: Brand, attributes: ['name'] }
            ]
        });

        // Formater le produit pour le frontend
        const formattedProduct = {
            id_product: product.id_product,
            name: product.name,
            price: product.price,
            description: product.description,
            quantity: product.quantity,
            id_category: product.id_category,
            id_brand: product.id_brand,
            category: product.Category?.name || 'N/A',
            brand: product.Brand?.name || 'N/A',
            image: "/placeholder.png"
        };

        res.status(201).send(formattedProduct);
    } catch (e) {
        console.error('Error creating product:', e);
        res.status(500).send({ message: 'Error creating product', error: e.message });
    }
});

// Récupérer un produit par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
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
        });

        if (!product) {
            return res.status(404).send({ message: 'Product not found' });
        }

        // Formater le produit pour le frontend
        const rawImage = product.ProductImages && product.ProductImages[0]?.Image?.image;
        const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

        const formattedProduct = {
            id_product: product.id_product,
            name: product.name,
            price: product.price,
            description: product.description,
            quantity: product.quantity,
            id_category: product.id_category,
            id_brand: product.id_brand,
            category: product.Category?.name || 'N/A',
            brand: product.Brand?.name || 'N/A',
            image: imageBase64 || "/placeholder.png"
        };

        res.status(200).send(formattedProduct);
    } catch (e) {
        console.error('Error fetching product:', e);
        res.status(500).send({ message: 'Error fetching product', error: e.message });
    }
});


router.post('/image', upload.array('images'), async (req, res) => {
    try {
        console.log('POST /product/image - Request received');
        console.log('req.files:', req.files); // Debug
        console.log('req.body:', req.body); // Debug

        // Vérifier si des fichiers ont été téléchargés
        if (!req.files || req.files.length === 0) {
            console.error('No files uploaded');
            return res.status(400).send({ message: 'No files uploaded' });
        }

        const { id_product } = req.body;

        if (!id_product) {
            console.error('No product ID provided');
            return res.status(400).send({ message: 'Product ID is required' });
        }

        // Vérifier que le produit existe
        const product = await Product.findByPk(id_product);
        if (!product) {
            console.error(`Product with ID ${id_product} not found`);
            return res.status(404).send({ message: 'Product not found' });
        }

        // Traiter les images
        console.log(`Processing ${req.files.length} images for product ${id_product}`);

        const savedImages = [];

        for (const file of req.files) {
            // Créer une entrée dans la table Image
            const newImage = await Image.create({
                id_image: uuidv4(),
                image: file.buffer, // Stocker l'image en tant que BLOB
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Créer une entrée dans la table ProductImage pour lier l'image au produit
            await ProductImage.create({
                id_product_image: uuidv4(),
                id_product,
                id_image: newImage.id_image,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            savedImages.push(newImage.id_image);
        }

        console.log(`Successfully saved ${savedImages.length} images for product ${id_product}`);

        // Récupérer le produit mis à jour avec ses images
        const updatedProduct = await Product.findByPk(id_product, {
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
        });

        // Formater le produit pour le frontend
        const rawImage = updatedProduct.ProductImages && updatedProduct.ProductImages[0]?.Image?.image;
        const imageBase64 = rawImage ? `data:image/jpeg;base64,${rawImage.toString('base64')}` : null;

        const formattedProduct = {
            id_product: updatedProduct.id_product,
            name: updatedProduct.name,
            price: updatedProduct.price,
            description: updatedProduct.description,
            quantity: updatedProduct.quantity,
            id_category: updatedProduct.id_category,
            id_brand: updatedProduct.id_brand,
            category: updatedProduct.Category?.name || 'N/A',
            brand: updatedProduct.Brand?.name || 'N/A',
            image: imageBase64 || "/placeholder.png"
        };

        console.log('Returning updated product with images');
        res.status(200).send(formattedProduct);
    } catch (e) {
        console.error('Error adding images to product:', e);
        res.status(500).send({
            message: 'Error adding images to product',
            error: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
