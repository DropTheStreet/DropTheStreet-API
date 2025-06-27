const express = require('express');
const router = express.Router();
const { Payment } = require('../../models/models/cart/payment.model');
const { PaymentDetail } = require('../../models/models/cart/payment_detail.model');
const { PaymentStatus } = require('../../models/models/cart/payment_status.model');
const { User } = require('../../models/models/user/user.model');
const { Product } = require('../../models/models/product/product.model');
const { CartItem } = require('../../models/models/cart/cart_item.model');
const { Drop } = require('../../models/models/drop/drop.model');
const { Auction } = require('../../models/models/auction/auction.model');
const { v4: uuidv4 } = require('uuid');
const UserRepository = require("../../models/repositories/user/user-repository");
const CartItemRepository = require("../../models/repositories/cart/cart_item-repository");

router.post('/seeder', async (req, res) => {
    try {
        const users = await UserRepository.getUsersByRoleName('User');
        if (users.length < 1) {
            return res.status(400).send({ message: 'Not enough users for seeding' });
        }

        const sellers = await UserRepository.getUsersByRoleName('Seller');
        if (sellers.length < 1) {
            return res.status(400).send({ message: 'Not enough sellers for seeding' });
        }

        const admins = await UserRepository.getUsersByRoleName('Admin');
        if (admins.length < 1) {
            return res.status(400).send({ message: 'Not enough admins for seeding' });
        }

        const products = await Product.findAll();
        if (products.length < 3) {
            return res.status(400).send({ message: 'Not enough products for seeding' });
        }

        const paymentStatuses = await PaymentStatus.findAll();
        if (paymentStatuses.length < 3) {
            return res.status(400).send({ message: 'Not enough payment statuses for seeding' });
        }

        const payments = [
            {
                id_user: users[0].id_user,
                id_payment_status: paymentStatuses[0].id_payment_status,
                amount_total: 250.00,
                delivery_address: '123 Rue Exemple, Paris, France',
                payment_date: new Date(),
                id_seller: sellers[0].id_user,
                products: [
                    { id_product: products[0].id_product, quantity: 2, price_at_purchase: 50.00 },
                    { id_product: products[1].id_product, quantity: 1, price_at_purchase: 150.00 },
                ],
            },
            {
                id_user: admins[0].id_user,
                id_payment_status: paymentStatuses[1].id_payment_status,
                amount_total: 180.00,
                delivery_address: '456 Avenue Exemple, Lyon, France',
                payment_date: new Date(),
                id_seller: sellers[0].id_user,
                products: [
                    { id_product: products[1].id_product, quantity: 1, price_at_purchase: 100.00 },
                    { id_product: products[2].id_product, quantity: 2, price_at_purchase: 40.00 },
                ],
            },
        ];

        for (let payment of payments) {
            const newPayment = await Payment.create({
                id_payment: uuidv4(),
                id_user: payment.id_user,
                id_payment_status: payment.id_payment_status,
                amount_total: payment.amount_total,
                delivery_address: payment.delivery_address,
                payment_date: payment.payment_date,
                id_seller: payment.id_seller,
            });

            for (let product of payment.products) {
                await PaymentDetail.create({
                    id_payment_detail: uuidv4(),
                    id_payment: newPayment.id_payment,
                    id_product: product.id_product,
                    quantity: product.quantity,
                    price_at_purchase: product.price_at_purchase,
                });
            }

            console.log(`Payment created successfully for user ${payment.id_user}`);
        }

        const allPayments = await Payment.findAll({ include: PaymentDetail });

        res.status(200).send(allPayments);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error during adding of payments', error: e.message });
    }
});

// Route pour traiter un paiement réussi
router.post('/process-success', async (req, res) => {
    try {
        const { id_user, session_id, delivery_address } = req.body;

        console.log(`🎯 Traitement paiement réussi pour utilisateur: ${id_user}`);

        // 1. Récupérer les articles du panier de l'utilisateur
        const cartItems = await CartItemRepository.findByUserId(id_user);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun article dans le panier'
            });
        }

        // 2. Calculer le montant total
        const totalAmount = cartItems.reduce((total, item) => {
            if (item.Drop) return total + parseFloat(item.Drop.price);
            if (item.Auction) return total + item.Auction.actual_price;
            return total;
        }, 0);

        // 3. Obtenir le statut "Completed"
        const completedStatus = await PaymentStatus.findOne({
            where: { name: 'Completed' }
        });

        if (!completedStatus) {
            return res.status(500).json({
                success: false,
                message: 'Statut de paiement "Completed" non trouvé'
            });
        }

        // 4. Déterminer le vendeur (premier item du panier)
        const firstItem = cartItems[0];
        let sellerId = null;

        // Essayer de trouver un vendeur valide
        if (firstItem?.Drop?.id_vendor) {
            sellerId = firstItem.Drop.id_vendor;
        } else if (firstItem?.Auction?.id_user) {
            sellerId = firstItem.Auction.id_user;
        } else {
            // Si aucun vendeur trouvé, utiliser l'acheteur comme vendeur par défaut
            sellerId = id_user;
        }

        // 5. Créer l'enregistrement Payment
        const payment = await Payment.create({
            id_payment: uuidv4(),
            id_user: id_user,
            id_seller: sellerId,
            id_payment_status: completedStatus.id_payment_status,
            amount_total: totalAmount,
            delivery_address: delivery_address || 'Adresse non fournie',
            payment_date: new Date()
        });

        console.log(`💰 Payment créé: ${payment.id_payment}`);

        // 6. Traiter chaque article du panier
        const processedItems = [];

        for (const item of cartItems) {
            try {
                // Créer le PaymentDetail
                const price = item.Drop ? parseFloat(item.Drop.price) : item.Auction.actual_price;

                const paymentDetail = await PaymentDetail.create({
                    id_payment_detail: uuidv4(),
                    id_payment: payment.id_payment,
                    id_product: item.id_product,
                    quantity: 1,
                    price_at_purchase: price
                });

                console.log(`📝 PaymentDetail créé: ${paymentDetail.id_payment_detail}`);

                // Traiter selon le type (Drop ou Auction)
                if (item.Drop) {
                    // Diminuer la quantité du drop de 1
                    const drop = await Drop.findByPk(item.id_drop);
                    if (drop && drop.quantity > 0) {
                        const oldQuantity = drop.quantity;
                        await drop.update({ quantity: drop.quantity - 1 });
                        console.log(`📦 Drop ${item.id_drop} quantité: ${oldQuantity} → ${drop.quantity}`);
                    } else {
                        console.warn(`⚠️ Drop ${item.id_drop} non trouvé ou quantité insuffisante`);
                    }
                } else if (item.Auction) {
                    // Marquer l'enchère comme non disponible au lieu de la supprimer
                    const auction = await Auction.findByPk(item.id_auction);
                    if (auction) {
                        await auction.update({ disponible: false });
                        console.log(`🔨 Enchère ${item.id_auction} marquée comme non disponible`);
                    } else {
                        console.warn(`⚠️ Enchère ${item.id_auction} non trouvée`);
                    }
                }

                processedItems.push({
                    id_product: item.id_product,
                    type: item.Drop ? 'drop' : 'auction',
                    price: price
                });

            } catch (error) {
                console.error(`❌ Erreur traitement article ${item.id_cart_item}:`, error);
            }
        }

        // 7. Vider le panier
        const { CartItem } = require('../../models/models/cart/cart_item.model');
        const deletedCount = await CartItem.destroy({
            where: { id_user: id_user }
        });
        console.log(`🗑️ Panier vidé pour l'utilisateur ${id_user} (${deletedCount} articles supprimés)`);

        // 8. Réponse de succès
        res.json({
            success: true,
            message: 'Paiement traité avec succès',
            data: {
                payment_id: payment.id_payment,
                total_amount: totalAmount,
                items_processed: processedItems.length,
                session_id: session_id,
                delivery_address: delivery_address
            }
        });

        console.log(`✅ Paiement traité avec succès pour l'utilisateur ${id_user}`);

    } catch (error) {
        console.error('❌ Erreur lors du traitement du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du traitement du paiement',
            error: error.message
        });
    }
});

// Route pour récupérer les commandes d'un utilisateur
router.get('/orders', async (req, res) => {
    try {
        const { id_user } = req.query;

        if (!id_user) {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur requis'
            });
        }

        console.log(`📋 Récupération des commandes pour l'utilisateur: ${id_user}`);

        // Récupérer tous les paiements de l'utilisateur
        const payments = await Payment.findAll({
            where: { id_user },
            order: [['payment_date', 'DESC']]
        });

        if (payments.length === 0) {
            return res.json({
                success: true,
                data: {
                    orders: [],
                    statistics: {
                        total_orders: 0,
                        total_spent: 0,
                        total_items: 0,
                        average_order_value: 0
                    }
                }
            });
        }

        // Récupérer les détails pour chaque paiement
        const orders = [];

        for (const payment of payments) {
            // Récupérer les détails du paiement
            const paymentDetails = await PaymentDetail.findAll({
                where: { id_payment: payment.id_payment }
            });

            // Récupérer le statut du paiement
            const paymentStatus = await PaymentStatus.findByPk(payment.id_payment_status);

            // Récupérer les informations du vendeur
            const seller = await User.findByPk(payment.id_seller, {
                attributes: ['id_user', 'pseudo', 'email']
            });

            // Récupérer les produits pour chaque détail
            const items = [];

            // Récupérer tous les produits en une fois
            const productIds = paymentDetails.map(detail => detail.id_product);
            const products = await Product.findAll({
                where: { id_product: productIds },
                attributes: ['id_product', 'name', 'description', 'id_brand']
            });

            // Récupérer toutes les marques en une fois
            const brandIds = products.map(p => p.id_brand).filter(Boolean);
            let brands = [];
            if (brandIds.length > 0) {
                try {
                    const { Brand } = require('../../models/models/brand/brand.model');
                    brands = await Brand.findAll({
                        where: { id_brand: brandIds },
                        attributes: ['id_brand', 'name']
                    });
                } catch (error) {
                    console.warn('Erreur récupération marques:', error.message);
                }
            }

            // Créer un map des marques pour un accès rapide
            const brandMap = {};
            brands.forEach(brand => {
                brandMap[brand.id_brand] = brand.name;
            });

            // Construire les items
            for (const detail of paymentDetails) {
                const product = products.find(p => p.id_product === detail.id_product);

                if (product) {
                    const brandName = brandMap[product.id_brand] || 'Marque inconnue';

                    items.push({
                        id_payment_detail: detail.id_payment_detail,
                        quantity: detail.quantity,
                        price_at_purchase: parseFloat(detail.price_at_purchase),
                        product: {
                            id_product: product.id_product,
                            name: product.name,
                            description: product.description,
                            brand: brandName
                        }
                    });
                }
            }

            orders.push({
                id_payment: payment.id_payment,
                payment_date: payment.payment_date,
                amount_total: parseFloat(payment.amount_total),
                delivery_address: payment.delivery_address,
                status: paymentStatus ? paymentStatus.name : 'Inconnu',
                seller: seller ? {
                    id: seller.id_user,
                    pseudo: seller.pseudo,
                    email: seller.email
                } : null,
                items: items,
                items_count: items.length
            });
        }

        // Les données sont déjà formatées dans la boucle précédente
        const formattedOrders = orders;

        // Calculer les statistiques
        const totalOrders = formattedOrders.length;
        const totalSpent = formattedOrders.reduce((sum, order) => sum + order.amount_total, 0);
        const totalItems = formattedOrders.reduce((sum, order) => sum + order.items_count, 0);

        res.json({
            success: true,
            data: {
                orders: formattedOrders,
                statistics: {
                    total_orders: totalOrders,
                    total_spent: totalSpent,
                    total_items: totalItems,
                    average_order_value: totalOrders > 0 ? (totalSpent / totalOrders) : 0
                }
            }
        });

        console.log(`✅ ${totalOrders} commandes récupérées pour l'utilisateur ${id_user}`);

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des commandes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des commandes',
            error: error.message
        });
    }
});

// Route pour récupérer une commande spécifique
router.get('/orders/:id_payment', async (req, res) => {
    try {
        const { id_payment } = req.params;
        const { id_user } = req.query;

        if (!id_user) {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur requis'
            });
        }

        console.log(`🔍 Récupération de la commande ${id_payment} pour l'utilisateur ${id_user}`);

        // Récupérer la commande spécifique
        const payment = await Payment.findOne({
            where: {
                id_payment,
                id_user // S'assurer que la commande appartient à l'utilisateur
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        // Récupérer les détails du paiement
        const paymentDetails = await PaymentDetail.findAll({
            where: { id_payment: payment.id_payment }
        });

        // Récupérer le statut du paiement
        const paymentStatus = await PaymentStatus.findByPk(payment.id_payment_status);

        // Récupérer les informations du vendeur
        const seller = await User.findByPk(payment.id_seller, {
            attributes: ['id_user', 'pseudo', 'email']
        });

        // Récupérer les produits pour chaque détail
        const items = [];

        // Récupérer tous les produits en une fois
        const productIds = paymentDetails.map(detail => detail.id_product);
        const products = await Product.findAll({
            where: { id_product: productIds },
            attributes: ['id_product', 'name', 'description', 'id_brand']
        });

        // Récupérer toutes les marques en une fois
        const brandIds = products.map(p => p.id_brand).filter(Boolean);
        let brands = [];
        if (brandIds.length > 0) {
            try {
                const { Brand } = require('../../models/models/brand/brand.model');
                brands = await Brand.findAll({
                    where: { id_brand: brandIds },
                    attributes: ['id_brand', 'name']
                });
            } catch (error) {
                console.warn('Erreur récupération marques:', error.message);
            }
        }

        // Créer un map des marques pour un accès rapide
        const brandMap = {};
        brands.forEach(brand => {
            brandMap[brand.id_brand] = brand.name;
        });

        // Construire les items
        for (const detail of paymentDetails) {
            const product = products.find(p => p.id_product === detail.id_product);

            if (product) {
                const brandName = brandMap[product.id_brand] || 'Marque inconnue';

                items.push({
                    id_payment_detail: detail.id_payment_detail,
                    quantity: detail.quantity,
                    price_at_purchase: parseFloat(detail.price_at_purchase),
                    product: {
                        id_product: product.id_product,
                        name: product.name,
                        description: product.description,
                        brand: brandName
                    }
                });
            }
        }

        // Formater les données
        const formattedOrder = {
            id_payment: payment.id_payment,
            payment_date: payment.payment_date,
            amount_total: parseFloat(payment.amount_total),
            delivery_address: payment.delivery_address,
            status: paymentStatus ? paymentStatus.name : 'Inconnu',
            seller: seller ? {
                id: seller.id_user,
                pseudo: seller.pseudo,
                email: seller.email
            } : null,
            items: items,
            items_count: items.length
        };

        res.json({
            success: true,
            data: formattedOrder
        });

        console.log(`✅ Commande ${id_payment} récupérée avec succès`);

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la commande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la commande',
            error: error.message
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const payments = await Payment.findAll({ include: PaymentDetail });
        res.status(200).send(payments);
    } catch (e) {
        res.status(500).send({ message: 'Error getting all payments', error: e.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
