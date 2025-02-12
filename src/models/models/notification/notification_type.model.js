const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.NotificationType = sequelize.define('NotificationType', {
    id_notification_type: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
}, {
    tableName: 'NotificationType',
})