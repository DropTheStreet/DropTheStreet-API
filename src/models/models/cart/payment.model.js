const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Payment = sequelize.define('Payment', {
    id_payment: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_product: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_payment_status: {
        type: DataTypes.UUID,
        allowNull: false
    },
    amount_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    delivery_address: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'Payment',
})