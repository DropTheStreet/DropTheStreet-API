const express = require('express');
const userRoutes = require('../controllers/user/user.routes');
const supportRoutes = require('../controllers/support/support.routes');
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
const {Notification_Type} = require("../models/models/notification/notification_type.model");
const {Challenge} = require("../models/models/gamification/challenge.model");
const {Badge} = require("../models/models/gamification/badge.model");
const {HistoryAuction} = require("../models/models/auction/history_auction.model");
const {Auction} = require("../models/models/auction/auction.model");
const {PaymentStatus} = require("../models/models/cart/payment_status.model");
const {Payment} = require("../models/models/cart/payment.model");
const {ShoppingCart} = require("../models/models/cart/shopping_cart.model");
const {Category} = require("../models/models/product/category.model");
const {Role} = require("../models/models/user/role.model");

class WebServer {
    app = undefined;
    port = process.env.PORT;
    server = undefined;
    io = undefined;

    constructor() {
        this.app = express();
        require('dotenv').config();

        // Relation entre User et Role (Un utilisateur a un rôle)
        User.belongsTo(Role, { foreignKey: 'id_role' });
        Role.hasMany(User, { foreignKey: 'id_role' });

        // Relation entre Product et Category (Un produit appartient à une catégorie)
        Product.belongsTo(Category, { foreignKey: 'id_category' });
        Category.hasMany(Product, { foreignKey: 'id_category' });

        // Relation entre Product et ShoppingCart (Un produit peut être dans plusieurs paniers)
        Product.belongsToMany(ShoppingCart, { through: 'ShoppingCartProduct', foreignKey: 'id_product' });
        ShoppingCart.belongsToMany(Product, { through: 'ShoppingCartProduct', foreignKey: 'id_shopping_cart' });

        // Relation entre User et ShoppingCart (Un utilisateur peut avoir plusieurs produits dans son panier)
        User.hasMany(ShoppingCart, { foreignKey: 'id_user' });
        ShoppingCart.belongsTo(User, { foreignKey: 'id_user' });

        // Relation entre Product et Payment (Un produit peut être acheté dans un paiement)
        Product.belongsToMany(Payment, { through: 'PaymentProduct', foreignKey: 'id_product' });
        Payment.belongsToMany(Product, { through: 'PaymentProduct', foreignKey: 'id_payment' });

        // Relation entre User et Payment (Un utilisateur peut effectuer plusieurs paiements)
        User.hasMany(Payment, { foreignKey: 'id_user' });
        Payment.belongsTo(User, { foreignKey: 'id_user' });

        // Relation entre Payment et PaymentStatus (Un paiement a un statut)
        Payment.belongsTo(PaymentStatus, { foreignKey: 'id_payment_status' });
        PaymentStatus.hasMany(Payment, { foreignKey: 'id_payment_status' });

        // Relation entre Auction et User (Un utilisateur peut participer à plusieurs enchères)
        User.belongsToMany(Auction, { through: 'User_Auction', foreignKey: 'id_user' });
        Auction.belongsToMany(User, { through: 'User_Auction', foreignKey: 'id_auction' });

        // Relation entre Auction et HistoryAuction (Une enchère peut avoir plusieurs historiques)
        Auction.hasMany(HistoryAuction, { foreignKey: 'id_auction' });
        HistoryAuction.belongsTo(Auction, { foreignKey: 'id_auction' });

        // Relation entre Badge et User (Un utilisateur peut avoir plusieurs badges)
        User.belongsToMany(Badge, { through: 'User_Badge', foreignKey: 'id_user' });
        Badge.belongsToMany(User, { through: 'User_Badge', foreignKey: 'id_badge' });

        // Relation entre Challenge et User (Un utilisateur peut participer à plusieurs défis)
        User.belongsToMany(Challenge, { through: 'User_Challenge', foreignKey: 'id_user' });
        Challenge.belongsToMany(User, { through: 'User_Challenge', foreignKey: 'id_challenge' });

        // Relation entre User et Notification (Un utilisateur peut recevoir plusieurs notifications)
        User.hasMany(Notification, { foreignKey: 'id_user' });
        Notification.belongsTo(User, { foreignKey: 'id_user' });

        // Relation entre Notification et Notification_Type (Une notification a un type)
        Notification.belongsTo(Notification_Type, { foreignKey: 'id_notification_type' });
        Notification_Type.hasMany(Notification, { foreignKey: 'id_notification_type' });

        // Relation entre Product et Image (Un produit peut avoir plusieurs images)
        Product.belongsToMany(Image, { through: 'ProductImage', foreignKey: 'id_product' });
        Image.belongsToMany(Product, { through: 'ProductImage', foreignKey: 'id_image' });

        // Relation entre User et Statistic (Un utilisateur peut avoir plusieurs statistiques)
        User.hasMany(Statistic, { foreignKey: 'id_user' });
        Statistic.belongsTo(User, { foreignKey: 'id_user' });

        // Relation entre Drop et Product (Un produit peut être associé à un drop)
        Product.belongsToMany(Drop, { through: 'DropProduct', foreignKey: 'id_product' });
        Drop.belongsToMany(Product, { through: 'DropProduct', foreignKey: 'id_drop' });

        // Relation entre Product et ProductFavorite (Un produit peut être dans les favoris de plusieurs utilisateurs)
        Product.belongsToMany(ProductFavorite, { through: 'ProductFavoriteProduct', foreignKey: 'id_product' });
        ProductFavorite.belongsToMany(Product, { through: 'ProductFavoriteProduct', foreignKey: 'id_product_favorite' });

        // Relation entre ProductImage et Product (Une image appartient à un produit)
        ProductImage.belongsTo(Product, { foreignKey: 'id_product' });
        Product.hasMany(ProductImage, { foreignKey: 'id_product' });

        // Relation entre User et Support (Un utilisateur peut soumettre plusieurs demandes de support)
        User.hasMany(Support, { foreignKey: 'id_user' });
        Support.belongsTo(User, { foreignKey: 'id_user' });

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
        this.app.use('/users', userRoutes.initializeRoutes());
        this.app.use('/support', supportRoutes.initializeRoutes());
    }
}

module.exports = WebServer;