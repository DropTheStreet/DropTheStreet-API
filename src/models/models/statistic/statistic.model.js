const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Statistic = sequelize.define('Statistic', {
    id_statistic: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    sold_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    income: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    //date -> created at
}, {
    tableName: 'Statistic',
})