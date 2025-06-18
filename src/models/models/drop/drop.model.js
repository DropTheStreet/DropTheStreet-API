const {DataTypes} = require('sequelize')
const { sequelize } = require('../../mysql.db')

exports.Drop = sequelize.define('Drop', {
    id_drop: {
        type: DataTypes.UUID,
        primaryKey : true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
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
    is_premium: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue:false
    },
    id_product: {
        type: DataTypes.UUID,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    size: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    id_vendor: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'User',
            key: 'id_user'
        }
    }
}, {
    tableName: 'Drop',
})