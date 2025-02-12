const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.UserBadge = sequelize.define('UserBadge', {
    id_user_badge: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    //obtaining_date -> created at
}, {
    tableName: 'UserBadge',
})