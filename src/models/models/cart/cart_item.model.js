const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysql.db');

exports.CartItem = sequelize.define('CartItem', {
    id_cart_item: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_drop: {
        type: DataTypes.UUID,
        allowNull: true
    },
    id_auction: {
        type: DataTypes.UUID,
        allowNull: true
    },
    id_product: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'CartItem'
});
