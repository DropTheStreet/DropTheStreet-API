const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Support = sequelize.define('Support', {
    id_support: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
    },
    subject: {
        type: DataTypes.STRING(300),
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING(300),
        allowNull: false,
    },
    is_resolved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false
    },
    //date -> created at
}, {
    tableName: 'Support',
})