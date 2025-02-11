const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.User = sequelize.define('User', {
    id_user: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    pseudo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    photo:{
        type: DataTypes.BLOB,
        allowNull: true
    },
    dropcoins: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_role: {
        type: DataTypes.UUID,
        allowNull: false
    },
}, {
    tableName: 'User',
})