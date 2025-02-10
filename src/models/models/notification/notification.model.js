const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Notification = sequelize.define('Notification', {
    id_notification: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
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
    //date -> created at
}, {
    tableName: 'Notification',
})