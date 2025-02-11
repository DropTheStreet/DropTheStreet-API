const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Auction = sequelize.define('Auction', {
    id_auction: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    initial_price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    actual_price: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    //end and start date will be definded by devs, so it can't be "created at"
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
}, {
    tableName: 'Auction',
})