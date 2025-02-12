const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.UserChallenge = sequelize.define('UserChallenge', {
    id_user_challenge: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
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
    id_user: {
        type: DataTypes.UUID,
        allowNull: false
    },
    id_challenge: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'UserChallenge',
})