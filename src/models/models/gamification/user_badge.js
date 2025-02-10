const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.User_Badge = sequelize.define('User_Badge', {
    id_user_badge: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    //obtaining_date -> created at
}, {
    tableName: 'User_Badge',
})