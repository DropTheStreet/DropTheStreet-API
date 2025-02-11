const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.ProductFavorite = sequelize.define('ProductFavorite', {
    id_product_favorite: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    }
    //added_date -> created_at
}, {
    tableName: 'ProductFavorite',
})