const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysql.db');

exports.ShoppingCart = sequelize.define('ShoppingCart', {
    id_shopping_cart: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'ShoppingCart'
});
