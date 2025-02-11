const {DataTypes} = require('sequelize')
const { sequelize } = require('../mysql.db')

exports.PaymentStatus = sequelize.define('PaymentStatus', {
    id_payment_status: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
}, {
    tableName: 'PaymentStatus',
})