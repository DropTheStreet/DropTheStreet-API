const { DataTypes } = require('sequelize');
const { sequelize } = require('../../mysql.db');
const { v4: uuidv4 } = require('uuid');

/**
 * Modèle pour les messages du chat de drops
 * Permet aux utilisateurs de discuter pendant un drop
 */
const DropMessage = sequelize.define('DropMessage', {
    id_message: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
        allowNull: false
    },
    id_user: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'User',
            key: 'id_user'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    id_drop: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Drop',
            key: 'id_drop'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le message ne peut pas être vide'
            },
            len: {
                args: [1, 1000],
                msg: 'Le message doit contenir entre 1 et 1000 caractères'
            }
        }
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    edited_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'DropMessage',
    timestamps: true,
    indexes: [
        {
            fields: ['id_drop']
        },
        {
            fields: ['id_user']
        },
        {
            fields: ['createdAt']
        },
        {
            fields: ['id_drop', 'createdAt']
        }
    ]
});

module.exports = { DropMessage };
