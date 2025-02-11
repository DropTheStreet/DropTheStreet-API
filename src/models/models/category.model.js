const {DataTypes} = require('sequelize')
const { sequelize } = require('../mysql.db')

exports.Category = sequelize.define('Category', {
    id_category: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    tableName: 'Category',
})