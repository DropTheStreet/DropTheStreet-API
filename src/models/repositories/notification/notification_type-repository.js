const { NotificationType } = require('../../models/notification/notification_type.model.js');

class NotificationTypeRepository {
    async create(notificationTypeData) {
        return await Notification_Type.create(notificationTypeData);
    }

    async findById(id) {
        return await Notification_Type.findByPk(id);
    }

    async findAll() {
        return await Notification_Type.findAll();
    }

    async update(id, updatedData) {
        const notificationType = await Notification_Type.findByPk(id);
        if (!notificationType) {
            throw new Error('Notification type not found');
        }
        return await notificationType.update(updatedData);
    }

    async delete(id) {
        const notificationType = await Notification_Type.findByPk(id);
        if (!notificationType) {
            throw new Error('Notification type not found');
        }
        await notificationType.destroy();
        return true;
    }
}

module.exports = new NotificationTypeRepository();
