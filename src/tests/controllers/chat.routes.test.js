const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/chat/chat.routes');
const GeneralChatRepository = require('../../models/repositories/chat/general_chat-repository');

// Mock de tous les modèles Sequelize
jest.mock('../../models/mysql.db', () => ({
    sequelize: {
        sync: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
        define: jest.fn().mockReturnValue({
            create: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            findOne: jest.fn()
        })
    }
}));

jest.mock('../../models/models/chat/general_chat.model', () => ({
    GeneralChat: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

jest.mock('../../models/models/user/user.model', () => ({
    User: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn()
    }
}));

// Mock du repository
jest.mock('../../models/repositories/chat/general_chat-repository');

const { GeneralChat } = require('../../models/models/chat/general_chat.model');
const { User } = require('../../models/models/user/user.model');

const app = express();
app.use(express.json());
app.use('/chat', initializeRoutes());

describe('Chat Routes', () => {
    let mockTestData;

    beforeAll(async () => {
        // Données de test mockées
        mockTestData = {
            testUsers: [
                { id_user: 'user-1', pseudo: 'Alice', email: 'alice@test.com' },
                { id_user: 'user-2', pseudo: 'Bob', email: 'bob@test.com' },
                { id_user: 'user-3', pseudo: 'Charlie', email: 'charlie@test.com' }
            ],
            testMessages: [
                {
                    id_message: 'msg-1',
                    message: 'Salut tout le monde !',
                    id_user: 'user-1',
                    is_deleted: false,
                    createdAt: new Date()
                },
                {
                    id_message: 'msg-2',
                    message: 'Comment ça va ?',
                    id_user: 'user-2',
                    is_deleted: false,
                    createdAt: new Date()
                },
                {
                    id_message: 'msg-3',
                    message: 'Très bien merci !',
                    id_user: 'user-3',
                    is_deleted: false,
                    createdAt: new Date()
                }
            ]
        };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup des mocks par défaut
        User.findAll.mockResolvedValue(mockTestData.testUsers);
        GeneralChat.create.mockImplementation((data) => Promise.resolve({ 
            id_message: 'new-message-id', 
            ...data 
        }));
        GeneralChat.findAll.mockResolvedValue(mockTestData.testMessages);
        
        // Setup des mocks du repository
        GeneralChatRepository.create.mockResolvedValue(mockTestData.testMessages[0]);
        GeneralChatRepository.getChatHistory.mockResolvedValue(mockTestData.testMessages);
        GeneralChatRepository.getChatStats.mockResolvedValue({
            totalMessages: 100,
            todayMessages: 10,
            activeUsers: 5
        });
        GeneralChatRepository.searchMessages.mockResolvedValue([mockTestData.testMessages[0]]);
        GeneralChatRepository.getRecentMessages.mockResolvedValue(mockTestData.testMessages);
        GeneralChatRepository.deleteMessage.mockResolvedValue(true);
    });

    describe('POST /seeder', () => {
        it('should create test messages successfully', async () => {
            const response = await request(app)
                .post('/chat/seeder');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Messages de test créés avec succès');
            expect(response.body.count).toBe(6); // 3 messages créés + 3 messages existants
            expect(Array.isArray(response.body.messages)).toBe(true);
            expect(User.findAll).toHaveBeenCalledWith({ limit: 3 });
            expect(GeneralChat.create).toHaveBeenCalledTimes(6); // 3 messages créés + 3 messages existants
        });

        it('should return 400 if no users found', async () => {
            User.findAll.mockResolvedValueOnce([]);

            const response = await request(app)
                .post('/chat/seeder');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Aucun utilisateur trouvé pour créer des messages de test');
        });

        it('should return 500 on database error', async () => {
            User.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .post('/chat/seeder');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur lors de la création des messages de test');
        });
    });

    describe('GET /history', () => {
        it('should return chat history successfully', async () => {
            const response = await request(app)
                .get('/chat/history')
                .query({ limit: 20, offset: 0 });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.messages)).toBe(true);
            expect(response.body.messages.length).toBe(3);
            expect(response.body.count).toBe(3);
            expect(response.body.hasMore).toBe(false);
            expect(GeneralChatRepository.getChatHistory).toHaveBeenCalledWith(20, 0);
        });

        it('should use default pagination values', async () => {
            const response = await request(app)
                .get('/chat/history');

            expect(response.status).toBe(200);
            expect(GeneralChatRepository.getChatHistory).toHaveBeenCalledWith(50, 0);
        });

        it('should return 500 on repository error', async () => {
            GeneralChatRepository.getChatHistory.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/chat/history');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur lors de la récupération de l\'historique');
        });
    });

    describe('GET /stats', () => {
        it('should return chat statistics successfully', async () => {
            const response = await request(app)
                .get('/chat/stats');

            expect(response.status).toBe(200);
            expect(response.body.totalMessages).toBe(100);
            expect(response.body.todayMessages).toBe(10);
            expect(response.body.activeUsers).toBe(5);
            expect(GeneralChatRepository.getChatStats).toHaveBeenCalled();
        });

        it('should return 500 on repository error', async () => {
            GeneralChatRepository.getChatStats.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/chat/stats');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur lors de la récupération des statistiques');
        });
    });

    describe('GET /search', () => {
        it('should search messages successfully', async () => {
            const response = await request(app)
                .get('/chat/search')
                .query({ q: 'salut', limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.query).toBe('salut');
            expect(Array.isArray(response.body.results)).toBe(true);
            expect(response.body.results.length).toBe(1);
            expect(response.body.count).toBe(1);
            expect(GeneralChatRepository.searchMessages).toHaveBeenCalledWith('salut', 10);
        });

        it('should return 400 if query is too short', async () => {
            const response = await request(app)
                .get('/chat/search')
                .query({ q: 'a' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('La recherche doit contenir au moins 2 caractères');
        });

        it('should return 400 if query is missing', async () => {
            const response = await request(app)
                .get('/chat/search');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('La recherche doit contenir au moins 2 caractères');
        });

        it('should use default limit', async () => {
            const response = await request(app)
                .get('/chat/search')
                .query({ q: 'test' });

            expect(response.status).toBe(200);
            expect(GeneralChatRepository.searchMessages).toHaveBeenCalledWith('test', 20);
        });
    });

    describe('GET /', () => {
        it('should return all messages successfully', async () => {
            const response = await request(app)
                .get('/chat')
                .query({ limit: 50, offset: 0, includeDeleted: false });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.messages)).toBe(true);
            expect(response.body.messages.length).toBe(3);
            expect(response.body.count).toBe(3);
            expect(GeneralChat.findAll).toHaveBeenCalled();
        });

        it('should include deleted messages when requested', async () => {
            const response = await request(app)
                .get('/chat')
                .query({ includeDeleted: 'true' });

            expect(response.status).toBe(200);
            expect(GeneralChat.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {}
                })
            );
        });

        it('should return 500 on database error', async () => {
            GeneralChat.findAll.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/chat');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur lors de la récupération des messages');
        });
    });

    describe('DELETE /:messageId', () => {
        it('should delete message successfully', async () => {
            const response = await request(app)
                .delete('/chat/msg-1')
                .send({ userId: 'user-1' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Message supprimé avec succès');
            expect(GeneralChatRepository.deleteMessage).toHaveBeenCalledWith('msg-1', 'user-1');
        });

        it('should return 400 if messageId is missing', async () => {
            const response = await request(app)
                .delete('/chat/')
                .send({ userId: 'user-1' });

            expect(response.status).toBe(404); // Express retourne 404 pour route non trouvée
        });

        it('should return 500 on repository error', async () => {
            GeneralChatRepository.deleteMessage.mockRejectedValueOnce(new Error('Message not found'));

            const response = await request(app)
                .delete('/chat/msg-1')
                .send({ userId: 'user-1' });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Message not found');
        });
    });

    describe('POST /message', () => {
        it('should create message successfully', async () => {
            const messageData = {
                message: 'Nouveau message de test',
                userId: 'user-1'
            };

            const response = await request(app)
                .post('/chat/message')
                .send(messageData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Message créé avec succès');
            expect(GeneralChatRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Nouveau message de test',
                    id_user: 'user-1'
                })
            );
        });

        it('should return 400 if message is missing', async () => {
            const response = await request(app)
                .post('/chat/message')
                .send({ userId: 'user-1' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Message et ID utilisateur requis');
        });

        it('should return 400 if message is empty', async () => {
            const response = await request(app)
                .post('/chat/message')
                .send({ message: '   ', userId: 'user-1' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Le message ne peut pas être vide');
        });

        it('should return 400 if message is too long', async () => {
            const longMessage = 'a'.repeat(1001);
            const response = await request(app)
                .post('/chat/message')
                .send({ message: longMessage, userId: 'user-1' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Le message est trop long (maximum 1000 caractères)');
        });
    });

    describe('GET /recent', () => {
        it('should return recent messages successfully', async () => {
            const response = await request(app)
                .get('/chat/recent')
                .query({ limit: 10 });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.messages)).toBe(true);
            expect(response.body.messages.length).toBe(3);
            expect(response.body.count).toBe(3);
            expect(GeneralChatRepository.getRecentMessages).toHaveBeenCalledWith(10);
        });

        it('should use default limit', async () => {
            const response = await request(app)
                .get('/chat/recent');

            expect(response.status).toBe(200);
            expect(GeneralChatRepository.getRecentMessages).toHaveBeenCalledWith(20);
        });

        it('should return 500 on repository error', async () => {
            GeneralChatRepository.getRecentMessages.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app)
                .get('/chat/recent');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Erreur lors de la récupération des messages récents');
        });
    });
});
