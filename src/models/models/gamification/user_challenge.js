const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.User_Challenge = sequelize.define('User_Challenge', {
    id_user_challenge: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false
    },
    //from 1 to 10  (1 - 10%, 5 - 50%)
    progression: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_finished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
}, {
    tableName: 'User_Challenge',
})