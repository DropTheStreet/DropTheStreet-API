const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Badge = sequelize.define('Badge', {
    id_badge: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(300),
        allowNull: false
    },
    image: {
        type: DataTypes.BLOB,
        allowNull: true
    },
}, {
    tableName: 'Badge',
})