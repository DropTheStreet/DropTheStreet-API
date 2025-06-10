const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Brand = sequelize.define('Brand', {
    id_brand: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    tableName: 'Brand',
})