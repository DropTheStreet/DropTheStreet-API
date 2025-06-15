const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const WebServer = require('../core/web-server');
const GeneralChatRepository = require('../models/repositories/chat/general_chat-repository');

// Mock du repository pour éviter les dépendances de base de données
jest.mock('../models/repositories/chat/general_chat-repository');

describe('Tests de Chat WebSocket', () => {
    let webServer, clientSocket, testToken, serverPort;

    beforeAll(async () => {
        // Configuration du serveur de test
        process.env.NODE_ENV = 'test';
        process.env.PORT = 3001; // Port différent pour les tests
        serverPort = process.env.PORT;
        
        webServer = new WebServer();
        
        // Mock des méthodes du repository
        GeneralChatRepository.create.mockResolvedValue({
            id_message: 'test-message-id',
            message: 'Test message',
            id_user: 'test-user-id'
        });
        
        GeneralChatRepository.findById.mockResolvedValue({
            id_message: 'test-message-id',
            message: 'Test message',
            user: {
                id_user: 'test-user-id',
                pseudo: 'TestUser',
                photo: null
            },
            createdAt: new Date(),
            edited_at: null
        });
        
        GeneralChatRepository.getChatHistory.mockResolvedValue([]);
        GeneralChatRepository.getRecentMessages.mockResolvedValue([]);
        GeneralChatRepository.getChatStats.mockResolvedValue({
            totalMessages: 0,
            todayMessages: 0,
            activeUsers: 0
        });

        // Démarrer le serveur
        webServer.start();
        
        // Attendre que le serveur soit prêt
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        testToken = 'test123'; // Token de test
    });

    afterAll(async () => {
        if (webServer) {
            webServer.stop();
        }
        // Attendre la fermeture
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    beforeEach((done) => {
        clientSocket = new Client(`http://localhost:${serverPort}`, {
            transports: ['websocket']
        });
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.close();
        }
    });

    describe('Authentification Chat', () => {
        test('devrait authentifier avec un token de test', (done) => {
            clientSocket.emit('authenticate', { token: testToken });
            
            clientSocket.on('authenticated', (data) => {
                expect(data.user).toBeDefined();
                expect(data.user.email).toContain('test-');
                expect(data.user.pseudo).toContain('TestUser-');
                expect(data.message).toContain('mode test');
                done();
            });
        });

        test('devrait rejeter une authentification sans token', (done) => {
            clientSocket.emit('authenticate', {});
            
            clientSocket.on('authentication_error', (error) => {
                expect(error.message).toBe('Token invalide');
                done();
            });
        });
    });

    describe('Rejoindre/Quitter le Chat', () => {
        beforeEach((done) => {
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => done());
        });

        test('devrait rejoindre le chat général', (done) => {
            clientSocket.emit('join_general_chat');
            
            clientSocket.on('general_chat_joined', (data) => {
                expect(data.message).toContain('rejoint');
                expect(data.participantCount).toBeGreaterThan(0);
                done();
            });
        });

        test('devrait recevoir l\'historique en rejoignant le chat', (done) => {
            let eventsReceived = 0;
            const checkComplete = () => {
                eventsReceived++;
                if (eventsReceived === 2) done(); // joined + history
            };

            clientSocket.emit('join_general_chat');
            
            clientSocket.on('general_chat_joined', checkComplete);
            clientSocket.on('general_chat_history', (data) => {
                expect(data.messages).toBeDefined();
                expect(Array.isArray(data.messages)).toBe(true);
                checkComplete();
            });
        });

        test('devrait quitter le chat général', (done) => {
            clientSocket.emit('join_general_chat');
            
            clientSocket.on('general_chat_joined', () => {
                clientSocket.emit('leave_general_chat');
                
                clientSocket.on('general_chat_left', (data) => {
                    expect(data.message).toContain('quitté');
                    done();
                });
            });
        });

        test('devrait rejeter la connexion au chat sans authentification', (done) => {
            // Créer un nouveau client non authentifié
            const unauthClient = new Client(`http://localhost:${serverPort}`);
            
            unauthClient.on('connect', () => {
                unauthClient.emit('join_general_chat');
                
                unauthClient.on('chat_error', (error) => {
                    expect(error.message).toBe('Utilisateur non authentifié');
                    unauthClient.close();
                    done();
                });
            });
        });
    });

    describe('Envoi de Messages', () => {
        beforeEach((done) => {
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => {
                clientSocket.emit('join_general_chat');
                clientSocket.on('general_chat_joined', () => done());
            });
        });

        test('devrait envoyer un message avec succès', (done) => {
            const testMessage = 'Message de test unitaire';
            
            clientSocket.emit('send_general_message', { text: testMessage });
            
            clientSocket.on('new_general_message', (data) => {
                expect(data.message).toBe(testMessage);
                expect(data.user).toBeDefined();
                expect(data.user.pseudo).toContain('TestUser-');
                expect(data.timestamp).toBeDefined();
                expect(data.id_message).toBeDefined();
                done();
            });
        });

        test('devrait rejeter un message vide', (done) => {
            clientSocket.emit('send_general_message', { text: '' });
            
            clientSocket.on('chat_error', (error) => {
                expect(error.message).toContain('vide');
                done();
            });
        });

        test('devrait rejeter un message avec seulement des espaces', (done) => {
            clientSocket.emit('send_general_message', { text: '   ' });
            
            clientSocket.on('chat_error', (error) => {
                expect(error.message).toContain('vide');
                done();
            });
        });

        test('devrait rejeter un message trop long', (done) => {
            const longMessage = 'a'.repeat(1001);
            
            clientSocket.emit('send_general_message', { text: longMessage });
            
            clientSocket.on('chat_error', (error) => {
                expect(error.message).toContain('trop long');
                done();
            });
        });

        test('devrait rejeter l\'envoi sans être dans le chat', (done) => {
            // Quitter le chat d'abord
            clientSocket.emit('leave_general_chat');
            
            clientSocket.on('general_chat_left', () => {
                clientSocket.emit('send_general_message', { text: 'Test message' });
                
                clientSocket.on('chat_error', (error) => {
                    expect(error.message).toContain('authentifié');
                    done();
                });
            });
        });
    });

    describe('Historique du Chat', () => {
        beforeEach((done) => {
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => done());
        });

        test('devrait récupérer l\'historique du chat', (done) => {
            clientSocket.emit('get_general_chat_history', { limit: 10 });
            
            clientSocket.on('general_chat_history', (data) => {
                expect(data.messages).toBeDefined();
                expect(Array.isArray(data.messages)).toBe(true);
                expect(data.hasMore).toBeDefined();
                expect(typeof data.hasMore).toBe('boolean');
                done();
            });
        });

        test('devrait respecter la limite de l\'historique', (done) => {
            const limit = 5;
            clientSocket.emit('get_general_chat_history', { limit });
            
            clientSocket.on('general_chat_history', (data) => {
                expect(data.messages.length).toBeLessThanOrEqual(limit);
                done();
            });
        });

        test('devrait rejeter la récupération d\'historique sans authentification', (done) => {
            const unauthClient = new Client(`http://localhost:${serverPort}`);
            
            unauthClient.on('connect', () => {
                unauthClient.emit('get_general_chat_history');
                
                unauthClient.on('chat_error', (error) => {
                    expect(error.message).toBe('Utilisateur non authentifié');
                    unauthClient.close();
                    done();
                });
            });
        });
    });

    describe('Statistiques du Chat', () => {
        beforeEach((done) => {
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => done());
        });

        test('devrait récupérer les statistiques du chat', (done) => {
            clientSocket.emit('get_chat_stats');
            
            clientSocket.on('chat_stats', (data) => {
                expect(data.totalMessages).toBeDefined();
                expect(data.todayMessages).toBeDefined();
                expect(data.activeUsers).toBeDefined();
                expect(data.onlineParticipants).toBeDefined();
                expect(typeof data.totalMessages).toBe('number');
                expect(typeof data.onlineParticipants).toBe('number');
                done();
            });
        });
    });

    describe('Gestion des Erreurs', () => {
        test('devrait gérer les erreurs de base de données', (done) => {
            // Mock d'une erreur de base de données
            GeneralChatRepository.create.mockRejectedValueOnce(new Error('Database error'));
            
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => {
                clientSocket.emit('join_general_chat');
                clientSocket.on('general_chat_joined', () => {
                    clientSocket.emit('send_general_message', { text: 'Test message' });
                    
                    clientSocket.on('chat_error', (error) => {
                        expect(error.message).toBeDefined();
                        done();
                    });
                });
            });
        });
    });

    describe('Événements Multiples Utilisateurs', () => {
        let client2;

        beforeEach((done) => {
            client2 = new Client(`http://localhost:${serverPort}`);
            client2.on('connect', done);
        });

        afterEach(() => {
            if (client2 && client2.connected) {
                client2.close();
            }
        });

        test('devrait notifier quand un utilisateur rejoint le chat', (done) => {
            // Authentifier et rejoindre avec le premier client
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => {
                clientSocket.emit('join_general_chat');
                clientSocket.on('general_chat_joined', () => {
                    
                    // Écouter les notifications de nouveaux utilisateurs
                    clientSocket.on('user_joined_chat', (data) => {
                        expect(data.userId).toBeDefined();
                        expect(data.pseudo).toBeDefined();
                        expect(data.participantCount).toBeGreaterThan(1);
                        done();
                    });
                    
                    // Faire rejoindre le deuxième client
                    client2.emit('authenticate', { token: 'test' });
                    client2.on('authenticated', () => {
                        client2.emit('join_general_chat');
                    });
                });
            });
        });

        test('devrait diffuser les messages à tous les participants', (done) => {
            const testMessage = 'Message diffusé à tous';
            let messagesReceived = 0;
            
            const checkMessage = (data) => {
                expect(data.message).toBe(testMessage);
                messagesReceived++;
                if (messagesReceived === 2) done(); // Les deux clients ont reçu le message
            };
            
            // Authentifier et rejoindre avec les deux clients
            clientSocket.emit('authenticate', { token: testToken });
            client2.emit('authenticate', { token: 'test' });
            
            let joinedCount = 0;
            const checkJoined = () => {
                joinedCount++;
                if (joinedCount === 2) {
                    // Les deux clients sont dans le chat, envoyer un message
                    clientSocket.on('new_general_message', checkMessage);
                    client2.on('new_general_message', checkMessage);
                    
                    clientSocket.emit('send_general_message', { text: testMessage });
                }
            };
            
            clientSocket.on('authenticated', () => {
                clientSocket.emit('join_general_chat');
                clientSocket.on('general_chat_joined', checkJoined);
            });
            
            client2.on('authenticated', () => {
                client2.emit('join_general_chat');
                client2.on('general_chat_joined', checkJoined);
            });
        });
    });
});
