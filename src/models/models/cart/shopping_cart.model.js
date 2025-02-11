const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.ProductImage = sequelize.define('ProductImage', {
    id_shopping_cart: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_product: {
        type: DataTypes.UUID,
        allowNull: false
    },
    quantity: {
        type: DataTypes.NUMBER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    size: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    // added_date -> created_at
}, {
    tableName: 'ProductImage',
})