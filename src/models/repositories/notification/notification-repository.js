const { Notification } = require('../../models/notification/notification.model.js');

class NotificationRepository {
    async create(notificationData) {
        return Notification.create(notificationData);
    }

    async findById(id) {
        return await Notification.findByPk(id);
    }

    async findAll() {
        return await Notification.findAll();
    }

    async update(id, updatedData) {
        const notification = await Notification.findByPk(id);
        if (!notification) {
            throw new Error('Notification was not found');
        }
        return await notification.update(updatedData);
    }

    async delete(id) {
        const notification = await Notification.findByPk(id);
        if (!notification) {
            throw new Error('Notification was not found');
        }
        await notification.destroy();
        return true;
    }
}

module.exports = new NotificationRepository();
