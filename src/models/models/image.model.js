const {DataTypes} = require('sequelize')
const { sequelize } = require('../mysql.db')

exports.Image = sequelize.define('Image', {
    id_image: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    image: {
        type: DataTypes.BLOB,
        allowNull: false
    }
}, {
    tableName: 'Image',
})