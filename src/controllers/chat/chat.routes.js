const express = require('express');
const router = express.Router();
const GeneralChatRepository = require('../../models/repositories/chat/general_chat-repository');
const { GeneralChat } = require('../../models/models/chat/general_chat.model');
const { v4: uuidv4 } = require('uuid');

// Route pour créer des messages de test (seeder)
router.post('/seeder', async (req, res) => {
    try {
        const { User } = require('../../models/models/user/user.model');
        
        // Récupérer quelques utilisateurs pour créer des messages de test
        const users = await User.findAll({ limit: 3 });
        if (users.length === 0) {
            return res.status(400).send({ message: 'Aucun utilisateur trouvé pour créer des messages de test' });
        }

        const testMessages = [
            { text: 'Salut tout le monde ! 👋', userId: users[0].id_user },
            { text: 'Quelqu\'un a vu les nouvelles enchères ?', userId: users[1].id_user },
            { text: 'Super application ! J\'adore le système d\'enchères', userId: users[0].id_user },
            { text: 'Des conseils pour les nouveaux utilisateurs ?', userId: users[2].id_user },
            { text: 'N\'hésitez pas à poser vos questions ici', userId: users[1].id_user },
            { text: 'Bonne chance à tous pour les enchères ! 🍀', userId: users[2].id_user }
        ];

        const createdMessages = [];
        for (let i = 0; i < testMessages.length; i++) {
            const message = testMessages[i];
            const createdMessage = await GeneralChat.create({
                id_message: uuidv4(),
                message: message.text,
                id_user: message.userId
            });
            createdMessages.push(createdMessage);
            
            // Ajouter un délai entre les messages pour simuler une conversation
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        res.status(200).send({
            message: 'Messages de test créés avec succès',
            count: createdMessages.length,
            messages: createdMessages
        });
    } catch (error) {
        console.error('Erreur lors de la création des messages de test:', error);
        res.status(500).send({ message: 'Erreur lors de la création des messages de test', error: error.message });
    }
});

// Route pour récupérer l'historique du chat (REST)
router.get('/history', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const messages = await GeneralChatRepository.getChatHistory(parseInt(limit), parseInt(offset));
        
        res.status(200).json({
            messages: messages,
            count: messages.length,
            hasMore: messages.length === parseInt(limit)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique', error: error.message });
    }
});

// Route pour obtenir les statistiques du chat
router.get('/stats', async (req, res) => {
    try {
        const stats = await GeneralChatRepository.getChatStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
    }
});

// Route pour rechercher des messages
router.get('/search', async (req, res) => {
    try {
        const { q: query, limit = 20 } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({ message: 'La recherche doit contenir au moins 2 caractères' });
        }

        const results = await GeneralChatRepository.searchMessages(query.trim(), parseInt(limit));
        
        res.status(200).json({
            query: query.trim(),
            results: results,
            count: results.length
        });
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ message: 'Erreur lors de la recherche', error: error.message });
    }
});

// Route pour récupérer tous les messages (admin)
router.get('/', async (req, res) => {
    try {
        const { limit = 100, offset = 0, includeDeleted = false } = req.query;
        
        const whereClause = includeDeleted === 'true' ? {} : { is_deleted: false };
        
        const messages = await GeneralChat.findAll({
            where: whereClause,
            include: [
                {
                    model: require('../../models/models/user/user.model').User,
                    attributes: ['id_user', 'pseudo', 'email'],
                    as: 'user'
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            messages: messages,
            count: messages.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des messages', error: error.message });
    }
});

// Route pour supprimer un message (admin)
router.delete('/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId } = req.body; // ID de l'utilisateur qui fait la demande
        
        if (!messageId) {
            return res.status(400).json({ message: 'ID du message manquant' });
        }

        await GeneralChatRepository.deleteMessage(messageId, userId);
        
        res.status(200).json({ message: 'Message supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({ message: error.message || 'Erreur lors de la suppression du message' });
    }
});

// Route pour créer un message via REST (pour les tests)
router.post('/message', async (req, res) => {
    try {
        const { message, userId } = req.body;
        
        if (!message || !userId) {
            return res.status(400).json({ message: 'Message et ID utilisateur requis' });
        }

        if (message.trim().length === 0) {
            return res.status(400).json({ message: 'Le message ne peut pas être vide' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ message: 'Le message est trop long (maximum 1000 caractères)' });
        }

        const newMessage = await GeneralChatRepository.create({
            id_message: uuidv4(),
            message: message.trim(),
            id_user: userId
        });

        const completeMessage = await GeneralChatRepository.findById(newMessage.id_message);
        
        res.status(201).json({
            message: 'Message créé avec succès',
            data: completeMessage
        });
    } catch (error) {
        console.error('Erreur lors de la création du message:', error);
        res.status(500).json({ message: 'Erreur lors de la création du message', error: error.message });
    }
});

// Route pour obtenir les messages récents
router.get('/recent', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const messages = await GeneralChatRepository.getRecentMessages(parseInt(limit));
        
        res.status(200).json({
            messages: messages,
            count: messages.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages récents:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des messages récents', error: error.message });
    }
});

// Fonction pour initialiser les routes
function initializeRoutes() {
    return router;
}

module.exports = { initializeRoutes };
