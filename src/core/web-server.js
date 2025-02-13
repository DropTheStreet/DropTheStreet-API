const express = require('express');
const allRoutes = require('../controllers/seeder.routes.js');
const userRoutes = require('../controllers/user/user.routes');
const supportRoutes = require('../controllers/support/support.routes');
const roleRoutes = require('../controllers/user/role.routes');
const statisticRoutes = require('../controllers/statistic/statistic.routes');
const productRoutes = require('../controllers/product/product.routes');
const productCategoryRoutes = require('../controllers/product/category.routes');
const productFavoriteRoutes = require('../controllers/product/product_favorite.routes');
const imageRoutes = require('../controllers/product/image.routes');
const productImageRoutes = require('../controllers/product/product_image.routes');
const notificationRoutes = require('../controllers/notification/notification.routes');
const notificationTypeRoutes = require('../controllers/notification/notification_type.routes');
const badgeRoutes = require('../controllers/gamification/badge.routes');
const challengeRoutes = require('../controllers/gamification/challenge.routes');
const userBadgeRoutes = require('../controllers/gamification/user_badge.routes');
const userChallengeRoutes = require('../controllers/gamification/user_challenge.routes');
const dropRoutes = require('../controllers/drop/drop.routes');
const cartRoutes = require('../controllers/cart/shopping_cart.routes');
const paymentStatusRoutes = require('../controllers/cart/payment_status.routes');
const paymentRoutes = require('../controllers/cart/payment.routes');
const auctionRoutes = require('../controllers/auction/auction.routes');
const historyAuctionRoutes = require('../controllers/auction/history_auction.routes');
const { sequelize } = require('../models/mysql.db')
const http = require('http');
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
const {ShoppingCart} = require("../models/models/cart/shopping_cart.model");
const {Category} = require("../models/models/product/category.model");
const {Role} = require("../models/models/user/role.model");
const {UserBadge} = require("../models/models/gamification/user_badge.model");
const {UserChallenge} = require("../models/models/gamification/user_challenge.model");

class WebServer {
    app = undefined;
    port = process.env.PORT;
    server = undefined;
    io = undefined;

    constructor() {
        this.app = express();
        require('dotenv').config();

        // Relation entre User et Role
        User.belongsTo(Role, { foreignKey: 'id_role', onDelete: 'CASCADE' });
        Role.hasMany(User, { foreignKey: 'id_role' });

        // Relations liées aux enchères
        User.hasMany(Auction, { foreignKey: 'id_user' });
        Auction.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        Product.hasMany(Auction, { foreignKey: 'id_product' });
        Auction.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        Auction.hasMany(HistoryAuction, { foreignKey: 'id_auction' });
        HistoryAuction.belongsTo(Auction, { foreignKey: 'id_auction', onDelete: 'CASCADE' });

        User.hasMany(HistoryAuction, { foreignKey: 'id_user' });
        HistoryAuction.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        // Relations liées aux paiements
        User.hasMany(Payment, { foreignKey: 'id_user' });
        Payment.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        Product.hasMany(Payment, { foreignKey: 'id_product' });
        Payment.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        PaymentStatus.hasMany(Payment, { foreignKey: 'id_payment_status' });
        Payment.belongsTo(PaymentStatus, { foreignKey: 'id_payment_status', onDelete: 'CASCADE' });

        // Relations liées au panier
        User.hasMany(ShoppingCart, { foreignKey: 'id_user' });
        ShoppingCart.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        Product.hasMany(ShoppingCart, { foreignKey: 'id_product' });
        ShoppingCart.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

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

        Product.hasOne(Statistic, { foreignKey: 'id_product' });
        Statistic.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        // Relations liées aux drops
        Product.hasMany(Drop, { foreignKey: 'id_product' });
        Drop.belongsTo(Product, { foreignKey: 'id_product', onDelete: 'CASCADE' });

        // Relation avec le support
        Support.belongsTo(User, { foreignKey: 'id_user', onDelete: 'CASCADE' });

        sequelize.sync();
      // sequelize.sync({ force: true });

        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        initializeErrorMiddlwares(this.app);
    }

    start() {
        this.server = http.createServer(this.app);
        this.server.listen(this.port, () => {
            console.log(`Example app listening on port ${this.port}`);
        });
        console.log(process.env.NODE_ENV);
    }

    stop() {
        this.server.close();
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
        this.app.use('/cart', cartRoutes.initializeRoutes());
        this.app.use('/payment-status', paymentStatusRoutes.initializeRoutes());
        this.app.use('/payment', paymentRoutes.initializeRoutes());
        this.app.use('/auction', auctionRoutes.initializeRoutes());
        this.app.use('/history-auction', historyAuctionRoutes.initializeRoutes());
    }
}

module.exports = WebServer;