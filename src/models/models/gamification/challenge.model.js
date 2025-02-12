const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Challenge = sequelize.define('Challenge', {
    id_challenge: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(300),
        allowNull: false
    },
    //will be in dropcoins
    reward: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_actif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
    },
}, {
    tableName: 'Challenge',
})