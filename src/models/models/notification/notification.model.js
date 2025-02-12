const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Notification = sequelize.define('Notification', {
    id_notification: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    content: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
    },
    id_notification_type: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false
    },
    //date -> created at
}, {
    tableName: 'Notification',
})