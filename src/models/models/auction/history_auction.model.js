const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.History_Auction = sequelize.define('History_Auction', {
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