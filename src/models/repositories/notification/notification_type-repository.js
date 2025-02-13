const { NotificationType } = require('../../models/notification/notification_type.model.js');

class NotificationTypeRepository {
    async create(notificationTypeData) {
        return NotificationType.create(notificationTypeData);
    }

    async findById(id) {
        return await NotificationType.findByPk(id);
    }

    async findAll() {
        return await NotificationType.findAll();
    }

    async update(id, updatedData) {
        const notificationType = await NotificationType.findByPk(id);
        if (!notificationType) {
            throw new Error('Notification type was not found');
        }
        return await notificationType.update(updatedData);
    }

    async delete(id) {
        const notificationType = await NotificationType.findByPk(id);
        if (!notificationType) {
            throw new Error('Notification type was not found');
        }
        await notificationType.destroy();
        return true;
    }
}

module.exports = new NotificationTypeRepository();
