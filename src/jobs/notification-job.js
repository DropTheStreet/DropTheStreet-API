const { Op } = require('sequelize');
const cron = require('node-cron');
const { Notification } = require('../models/models/notification/notification.model.js');

class NotificationCronService {
    constructor() {
        this.cronJob = null;
    }

    /**
     * Récupère les notifications à envoyer maintenant (non envoyées et prêtes).
     */
    async getNotificationsToSend() {
        const now = new Date();
        const oneMinuteBefore = new Date(now.getTime() - 60 * 1000);
        const oneMinuteAfter = new Date(now.getTime() + 60 * 1000);
        return await Notification.findAll({
            where: {
                sendAt: {
                    [Op.between]: [oneMinuteBefore, oneMinuteAfter]
                },
                is_sent: false
            }
        });
    }

    /**
     * Simule l'envoi de la notification (tu peux remplacer ça par un WebSocket plus tard),
     * puis marque la notification comme envoyée.
     */
    async sendNotification(notification) {
        console.log(`Notification envoyée à l'utilisateur ${notification.id_user} : ${notification.content}`);

        // Mise à jour de is_sent à true
        notification.is_sent = true;
        await notification.save();
    }

    /**
     * Tâche principale du job.
     */
    async runNotificationJob() {
        try {
            const notifications = await this.getNotificationsToSend();

            console.log(notifications + "2")
            for (const notif of notifications) {
                await this.sendNotification(notif);
            }
        } catch (err) {
            console.error('Erreur dans le cron des notifications :', err);
        }
    }

    /**
     * Démarre le cron job
     */
    startCronNotification() {
        if (this.cronJob) {
            console.log('⚠️  Le cron des notifications est déjà démarré');
            return;
        }

        this.cronJob = cron.schedule('* * * * *', () => {
            console.log('🔔 Cron des notifications déclenché');
            this.runNotificationJob();
        }, {
            scheduled: false // Ne démarre pas automatiquement
        });

        this.cronJob.start();
        console.log('✅ Cron des notifications démarré');
    }

    /**
     * Arrête le cron job
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log('🛑 Cron des notifications arrêté');
        }
    }

    /**
     * Redémarre le cron job
     */
    restart() {
        this.stop();
        this.startCronNotification();
    }
}

module.exports = NotificationCronService;