const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysql.db');

exports.GeneralChat = sequelize.define('GeneralChat', {
    id_message: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 1000] // Message entre 1 et 1000 caractères
        }
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'User',
            key: 'id_user'
        }
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    edited_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'GeneralChat',
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    paranoid: false   // Pas de soft delete automatique, on gère avec is_deleted
});
