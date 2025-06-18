const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Product = sequelize.define('Product', {
    id_product: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    id_category: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_brand: {
        type: DataTypes.UUID,
        allowNull: false
    },
    //added_date -> created_at
}, {
    tableName: 'Product',
})