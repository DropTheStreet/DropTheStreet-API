const express = require('express');
const allRoutes = require('../controllers/seeder.routes.js');
const userRoutes = require('../controllers/user/user.routes');
const supportRoutes = require('../controllers/support/support.routes');
const roleRoutes = require('../controllers/user/role.routes');
const statisticRoutes = require('../controllers/statistic/statistic.routes');
const productRoutes = require('../controllers/product/product.routes');
const productCategoryRoutes = require('../controllers/product/category.routes');
const productBrandRoutes = require('../controllers/product/brand.routes');
const productFavoriteRoutes = require('../controllers/product/product_favorite.routes');
const imageRoutes = require('../controllers/product/image.routes');
const productImageRoutes = require('../controllers/product/product_image.routes');
const notificationRoutes = require('../controllers/notification/notification.routes');
const notificationTypeRoutes = require('../controllers/notification/notification_type.routes');
const badgeRoutes = require('../controllers/gamification/badge.routes');
const challengeRoutes = require('../controllers/gamification/challenge.routes');
const userBadgeRoutes = require('../controllers/gamification/user_badge.routes');
const cartItemRoutes = require('../controllers/cart/cart_item.routes');
const userChallengeRoutes = require('../controllers/gamification/user_challenge.routes');
const dropRoutes = require('../controllers/drop/drop.routes');
const paymentStatusRoutes = require('../controllers/cart/payment_status.routes');
const paymentRoutes = require('../controllers/cart/payment.routes');
const paymentDetailsRoutes = require('../controllers/cart/payment_detail.routes');
const auctionRoutes = require('../controllers/auction/auction.routes');
const historyAuctionRoutes = require('../controllers/auction/history_auction.routes');
const chatRoutes = require('../controllers/chat/chat.routes');
const { sequelize } = require('../models/mysql.db')
const {initializeConfigMiddlewares, initializeErrorMiddlwares} = require("./middlewares");
const {User} = require("../models/models/user/user.model");
const {Support} = require("../models/models/support/support.model");
const {Product} = require("../models/models/product/product.model");
const {Image} = require("../models/models/product/image.model");
const {ProductImage} = require("../models/models/product/product_image.model");
const {ProductFavorite} = require("../models/models/product/product_favorite.model");
const {Drop} = require("../models/models/drop/drop.model");
const {Statistic} = require("../models/models/statistic/statistic.model");
const {Notification} = require("../models/models/notification/notification.model");
const {NotificationType} = require("../models/models/notification/notification_type.model");
const {Challenge} = require("../models/models/gamification/challenge.model");
const {Badge} = require("../models/models/gamification/badge.model");
const {HistoryAuction} = require("../models/models/auction/history_auction.model");
const {Auction} = require("../models/models/auction/auction.model");
const {PaymentStatus} = require("../models/models/cart/payment_status.model");
const {Payment} = require("../models/models/cart/payment.model");
const {Category} = require("../models/models/product/category.model");
const {Role} = require("../models/models/user/role.model");
const {UserBadge} = require("../models/models/gamification/user_badge.model");
const {UserChallenge} = require("../models/models/gamification/user_challenge.model");
const passport = require('passport');
const session = require('express-session');
const {PaymentDetail} = require("../models/models/cart/payment_detail.model");
const {CartItem} = require("../models/models/cart/cart_item.model");
const {Brand} = require("../models/models/product/brand.model");
const {GeneralChat} = require("../models/models/chat/general_chat.model");

const http = require('http');
const socketIo = require('socket.io');
const SocketHandler = require('./socket-handler');
const AuctionService = require('../services/auction.service');

class WebServer {
    app = undefined;
    port = process.env.PORT;
    server = undefined;
    io = undefined;
    socketHandler = undefined;
    auctionService = undefined;

    constructor() {
        this.app = express();
        require('dotenv').config();

        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'your-secret-key',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        this.app.use(passport.initialize());
        this.app.use(passport.session());

        // Relation entre User et Role
        User.belongsTo(Role, { foreignKey: 'id_role', as: 'role', onDelete: 'CASCADE' });
        Role.hasMany(User, { foreignKey: 'id_role', as: 'users' });


        // Relations liées aux enchères
        User.hasMany(Auction, { foreignKey: 'id_user', as: 'ownedAuctions' });
        Auction.belongsTo(User, { foreignKey: 'id_user', as: 'owner', onDelete: 'CASCADE' });

        Product.hasMany(Auction, { foreignKey: 'id_product' });
        Auction.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        Auction.hasMany(HistoryAuction, { foreignKey: 'id_auction' });
        HistoryAuction.belongsTo(Auction, { foreignKey: 'id_auction', onDelete: 'CASCADE' });

        User.hasMany(HistoryAuction, { foreignKey: 'id_user', as: 'bids' });
        HistoryAuction.belongsTo(User, { foreignKey: 'id_user', as: 'User', onDelete: 'CASCADE' });

        // Relations liées aux paiements
        User.hasMany(Payment, { foreignKey: 'id_user' });
        Payment.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        User.hasMany(Payment, { foreignKey: 'id_seller' });
        Payment.belongsTo(User, { foreignKey: 'id_seller', onDelete: 'CASCADE' });

        PaymentStatus.hasMany(Payment, { foreignKey: 'id_payment_status' });
        Payment.belongsTo(PaymentStatus, { foreignKey: 'id_payment_status', onDelete: 'CASCADE' });

        // Relations entre Payment et Product via PaymentDetail
        Payment.hasMany(PaymentDetail, { foreignKey: 'id_payment' });
        PaymentDetail.belongsTo(Payment, { foreignKey: 'id_payment', onDelete: 'CASCADE' });

        Product.hasMany(PaymentDetail, { foreignKey: 'id_product' });
        PaymentDetail.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        //Relations entre user, drop, auction, product et panier
        // Relations entre CartItem et User
        User.hasMany(CartItem, { foreignKey: 'id_user' });
        CartItem.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        // Relation entre CartItem et Drop
        Drop.hasMany(CartItem, { foreignKey: 'id_drop' });
        CartItem.belongsTo(Drop, { foreignKey: 'id_drop', onDelete: 'SET NULL' });

        // Relation entre CartItem et Auction
        Auction.hasMany(CartItem, { foreignKey: 'id_auction' });
        CartItem.belongsTo(Auction, { foreignKey: 'id_auction', onDelete: 'SET NULL' });

        // Relation entre CartItem et Product
        Product.hasMany(CartItem, { foreignKey: 'id_product' });
        CartItem.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        // Relations liées aux produits et images
        Product.hasMany(ProductImage, { foreignKey: 'id_product' });
        ProductImage.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        Image.hasMany(ProductImage, { foreignKey: 'id_image' });
        ProductImage.belongsTo(Image, { foreignKey: 'id_image', onDelete: 'CASCADE' });

        // Relations liées aux favoris
        User.hasMany(ProductFavorite, { foreignKey: 'id_user' });
        ProductFavorite.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        Product.hasMany(ProductFavorite, { foreignKey: 'id_product' });
        ProductFavorite.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        // Relations liées aux badges
        Badge.hasMany(UserBadge, { foreignKey: 'id_badge' });
        UserBadge.belongsTo(Badge, { foreignKey: 'id_badge', onDelete: 'CASCADE' });

        User.hasMany(UserBadge, { foreignKey: 'id_user' });
        UserBadge.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        // Relations liées aux challenges
        Challenge.hasMany(UserChallenge, { foreignKey: 'id_challenge' });
        UserChallenge.belongsTo(Challenge, { foreignKey: 'id_challenge', onDelete: 'CASCADE' });

        User.hasMany(UserChallenge, { foreignKey: 'id_user' });
        UserChallenge.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        // Relations liées aux notifications
        User.hasMany(Notification, { foreignKey: 'id_user' });
        Notification.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        NotificationType.hasMany(Notification, { foreignKey: 'id_notification_type' });
        Notification.belongsTo(NotificationType, { foreignKey: 'id_notification_type', onDelete: 'CASCADE' });

        // Relations liées aux catégories et statistiques
        Category.hasMany(Product, { foreignKey: 'id_category' });
        Product.belongsTo(Category, { foreignKey: 'id_category', onDelete: 'CASCADE' });

        // Relations liées aux marques et produits
        Brand.hasMany(Product, { foreignKey: 'id_brand' });
        Product.belongsTo(Brand, { foreignKey: 'id_brand', onDelete: 'CASCADE' });

        // Relations liées aux drops
        Product.hasMany(Drop, { foreignKey: 'id_product' });
        Drop.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        // Relation avec le support
        Support.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        // Relations liées au chat général
        User.hasMany(GeneralChat, { foreignKey: 'id_user', as: 'user' });
        GeneralChat.belongsTo(User, { foreignKey: 'id_user', as: 'user', onDelete: 'CASCADE' });

        // Relations liées au chat d'enchères
        const { AuctionMessage } = require('../models/models/auction/auction_message.model');
        User.hasMany(AuctionMessage, { foreignKey: 'id_user', as: 'auctionMessages' });
        AuctionMessage.belongsTo(User, { foreignKey: 'id_user', as: 'user', onDelete: 'CASCADE' });
        Auction.hasMany(AuctionMessage, { foreignKey: 'id_auction', as: 'chatMessages' });
        AuctionMessage.belongsTo(Auction, { foreignKey: 'id_auction', as: 'auction', onDelete: 'CASCADE' });

        // Relations liées au chat de drops
        const { DropMessage } = require('../models/models/drop/drop_message.model');
        User.hasMany(DropMessage, { foreignKey: 'id_user', as: 'dropMessages' });
        DropMessage.belongsTo(User, { foreignKey: 'id_user', as: 'user', onDelete: 'CASCADE' });
        Drop.hasMany(DropMessage, { foreignKey: 'id_drop', as: 'chatMessages' });
        DropMessage.belongsTo(Drop, { foreignKey: 'id_drop', as: 'drop', onDelete: 'CASCADE' });

        //Relations entre statistique et vendor, product, drop, auction

        Product.hasMany(Statistic, { foreignKey: 'id_product' });
        Statistic.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        User.hasMany(Statistic, { foreignKey: 'id_vendor' });
        Statistic.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        Product.hasMany(Statistic, { foreignKey: 'id_product' });
        Statistic.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        Drop.hasMany(Statistic, { foreignKey: 'id_drop' });
        Statistic.belongsTo(Drop, { foreignKey: 'id_drop', onDelete: 'SET NULL' });

        Auction.hasMany(Statistic, { foreignKey: 'id_auction' });
        Statistic.belongsTo(Auction, { foreignKey: 'id_auction', onDelete: 'SET NULL' });


        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        initializeErrorMiddlwares(this.app);
    }

    async start() {
        // Créer les tables dans le bon ordre avant de démarrer le serveur
        await this.createTablesInOrder();

        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            },
            // Désactiver toute compression
            perMessageDeflate: false,
            compression: false,
            httpCompression: false,
            // Forcer le polling si nécessaire
            transports: ['polling']
        });

        // Initialiser le gestionnaire de WebSockets
        this.socketHandler = new SocketHandler(this.io);

        // Initialiser le service d'enchères temps réel
        const AuctionRealtimeService = require('../services/auction-realtime.service');
        this.auctionRealtimeService = new AuctionRealtimeService(this.io);

        // Configurer le service dans le contrôleur d'enchères
        this.socketHandler.auctionSocketController.auctionService = this.auctionRealtimeService;

        // Démarrer le monitoring des enchères
        this.auctionRealtimeService.startAuctionMonitoring();

        this.server.listen(this.port, () => {
            console.log(`🚀 Serveur démarré sur le port ${this.port}`);
            console.log(`📡 WebSockets activés avec CORS`);
            console.log(`🔨 Environnement: ${process.env.NODE_ENV}`);
        });
    }

    stop() {
        console.log('🛑 Arrêt du serveur...');

        // Nettoyer les services
        if (this.auctionService) {
            this.auctionService.cleanup();
        }

        // Fermer les connexions WebSocket
        if (this.io) {
            this.io.close();
        }

        // Fermer le serveur HTTP
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Serveur arrêté proprement');
            });
        }
    }

    _initializeRoutes() {
        this.app.use('/all', allRoutes.initializeRoutes());
        this.app.use('/user', userRoutes.initializeRoutes());
        this.app.use('/role', roleRoutes.initializeRoutes());
        this.app.use('/users', userRoutes.initializeRoutes());
        this.app.use('/support', supportRoutes.initializeRoutes());
        this.app.use('/statistic', statisticRoutes.initializeRoutes());
        this.app.use('/product', productRoutes.initializeRoutes());
        this.app.use('/category', productCategoryRoutes.initializeRoutes());
        this.app.use('/brand', productBrandRoutes.initializeRoutes());
        this.app.use('/image', imageRoutes.initializeRoutes());
        this.app.use('/favorite', productFavoriteRoutes.initializeRoutes());
        this.app.use('/product-image', productImageRoutes.initializeRoutes());
        this.app.use('/notification', notificationRoutes.initializeRoutes());
        this.app.use('/notification-type', notificationTypeRoutes.initializeRoutes());
        this.app.use('/badge', badgeRoutes.initializeRoutes());
        this.app.use('/challenge', challengeRoutes.initializeRoutes());
        this.app.use('/user-badge', userBadgeRoutes.initializeRoutes());
        this.app.use('/user-challenge', userChallengeRoutes.initializeRoutes());
        this.app.use('/drop', dropRoutes.initializeRoutes());
        this.app.use('/payment-status', paymentStatusRoutes.initializeRoutes());
        this.app.use('/payment', paymentRoutes.initializeRoutes());
        this.app.use('/payment-detail', paymentDetailsRoutes.initializeRoutes());
        this.app.use('/auction', auctionRoutes.initializeRoutes());
        this.app.use('/history-auction', historyAuctionRoutes.initializeRoutes());
        this.app.use('/chat', chatRoutes.initializeRoutes());
        this.app.use('/shopping-cart', cartItemRoutes.initializeRoutes());

        // Route pour les statistiques WebSocket
        this.app.get('/socket/stats', async (req, res) => {
            try {
                const stats = await this.getSocketStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
            }
        });
    }

    // Méthode pour obtenir les statistiques des WebSockets
    async getSocketStats() {
        const stats = {
            connectedUsers: this.socketHandler ? this.socketHandler.getConnectedUsersCount() : 0,
            activeAuctionRooms: this.socketHandler ? this.socketHandler.auctionRooms.size : 0,
            serverUptime: process.uptime(),
            timestamp: new Date()
        };

        // Ajouter les statistiques des enchères si disponible
        if (this.auctionService) {
            const auctionStats = await this.auctionService.getAuctionStats();
            if (auctionStats) {
                stats.auctions = auctionStats;
            }
        }

        return stats;
    }

    /**
     * Créer les tables dans le bon ordre pour éviter les erreurs de clés étrangères
     */
    async createTablesInOrder() {
        console.log('🗄️  Création des tables dans l\'ordre correct...');

        try {
            // Niveau 1 - Tables sans dépendances
            console.log('📋 Niveau 1 - Tables de base...');
            await Role.sync({ force: false });
            await Category.sync({ force: false });
            await Brand.sync({ force: false });
            await Image.sync({ force: false });
            await PaymentStatus.sync({ force: false });
            await NotificationType.sync({ force: false });
            await Challenge.sync({ force: false });
            await Badge.sync({ force: false });

            // Niveau 2 - Tables avec 1 dépendance
            console.log('📋 Niveau 2 - Tables principales...');
            await User.sync({ force: false });
            await Product.sync({ force: false });

            // Niveau 3 - Tables avec 2+ dépendances
            console.log('📋 Niveau 3 - Tables de relations...');
            await ProductImage.sync({ force: false });
            await ProductFavorite.sync({ force: false });
            await Drop.sync({ force: false });
            await Auction.sync({ force: false });
            await GeneralChat.sync({ force: false });
            await Payment.sync({ force: false });
            await Support.sync({ force: false });
            await Notification.sync({ force: false });
            await UserBadge.sync({ force: false });
            await UserChallenge.sync({ force: false });

            // Niveau 4 - Tables finales
            console.log('📋 Niveau 4 - Tables finales...');
            await HistoryAuction.sync({ force: false });
            await CartItem.sync({ force: false });
            await PaymentDetail.sync({ force: false });
            await Statistic.sync({ force: false });

            // Ajouter AuctionMessage après les autres tables d'enchères
            const { AuctionMessage } = require('../models/models/auction/auction_message.model');
            await AuctionMessage.sync({ force: false });

            // Ajouter DropMessage après les autres tables de drops
            const { DropMessage } = require('../models/models/drop/drop_message.model');
            await DropMessage.sync({ force: false });

            console.log('✅ Toutes les tables créées avec succès dans le bon ordre !');

        } catch (error) {
            console.error('❌ Erreur lors de la création des tables:', error.message);
            throw error;
        }
    }
}

module.exports = WebServer;