const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Product = sequelize.define('Product', {
    id_product_favorite: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    image: {
        type: DataTypes.BLOB,
        allowNull: false
    },
    quantity: {
        type: DataTypes.NUMBER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    id_category: {
        type: DataTypes.UUID,
        allowNull: false
    },
    //added_date -> created_at
}, {
    tableName: 'Product',
})