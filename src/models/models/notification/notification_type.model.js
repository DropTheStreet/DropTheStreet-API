const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Notification_Type = sequelize.define('Notification_Type', {
    id_notification_type: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
}, {
    tableName: 'Notification_Type',
})