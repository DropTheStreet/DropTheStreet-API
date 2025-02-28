const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysql.db');

exports.CartItem = sequelize.define('CartItem', {
    id_cart_item: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    id_shopping_cart: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_product: {
        type: DataTypes.UUID,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    size: {
        type: DataTypes.STRING(10),
        allowNull: false
    }
}, {
    tableName: 'CartItem'
});
