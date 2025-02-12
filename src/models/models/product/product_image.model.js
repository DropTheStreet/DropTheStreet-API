const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.ProductImage = sequelize.define('ProductImage', {
    id_product_image: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    id_image: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_product: {
        type: DataTypes.UUID,
        allowNull: false
    },
}, {
    tableName: 'ProductImage',
})