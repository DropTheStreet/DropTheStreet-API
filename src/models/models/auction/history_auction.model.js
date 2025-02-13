const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.HistoryAuction = sequelize.define('HistoryAuction', {
    id_history_auction: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    //sum total
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_auction: {
        type: DataTypes.UUID,
        allowNull: false
    }
    //date -> created at
}, {
    tableName: 'HistoryAuction',
})