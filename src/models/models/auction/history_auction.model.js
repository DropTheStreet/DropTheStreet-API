const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.HistoryAuction = sequelize.define('HistoryAuction', {
    id_history_auction: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    //sum total
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    //date -> created at
}, {
    tableName: 'History_Auction',
})