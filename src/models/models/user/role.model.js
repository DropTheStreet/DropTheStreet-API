const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Role = sequelize.define('Role', {
    id_role: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
}, {
    tableName: 'Role',
})