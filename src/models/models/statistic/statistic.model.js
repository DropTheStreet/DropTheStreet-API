const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Statistic = sequelize.define('Statistic', {
    id_statistic: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    sold_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    id_vendor: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_product: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_drop: {
        type: DataTypes.UUID,
        allowNull: true
    },
    id_auction: {
        type: DataTypes.UUID,
        allowNull: true
    }
    //date -> created at
}, {
    tableName: 'Statistic',
})