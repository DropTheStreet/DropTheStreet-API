const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const WebServer = require('../core/web-server');
const jwt = require('jsonwebtoken');

describe('WebSocket Tests', () => {
    let webServer;
    let server;
    let clientSocket;
    let serverSocket;
    let testUser;
    let testToken;

    beforeAll(async () => {
        // Créer un serveur de test
        webServer = new WebServer();
        await new Promise((resolve) => {
            webServer.start();
            setTimeout(resolve, 1000); // Attendre que le serveur démarre
        });

        // Créer un utilisateur de test
        testUser = {
            id: 'test-user-id',
            email: 'test@example.com'
        };

        // Créer un token de test
        testToken = jwt.sign(testUser, process.env.SECRET_KEY || 'test-secret');
    });

    afterAll(async () => {
        if (webServer) {
            webServer.stop();
        }
    });

    beforeEach((done) => {
        // Créer une connexion client pour chaque test
        clientSocket = new Client(`http://localhost:${process.env.PORT || 3000}`);
        
        webServer.io.on('connection', (socket) => {
            serverSocket = socket;
        });
        
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket) {
            clientSocket.close();
        }
    });

    describe('Connexion et Authentification', () => {
        test('devrait se connecter au serveur WebSocket', (done) => {
            expect(clientSocket.connected).toBe(true);
            done();
        });

        test('devrait authentifier un utilisateur avec un token valide', (done) => {
            clientSocket.emit('authenticate', { token: testToken });
            
            clientSocket.on('authenticated', (data) => {
                expect(data.user.id).toBe(testUser.id);
                expect(data.user.email).toBe(testUser.email);
                done();
            });
        });

        test('devrait rejeter un token invalide', (done) => {
            clientSocket.emit('authenticate', { token: 'invalid-token' });
            
            clientSocket.on('authentication_error', (error) => {
                expect(error.message).toBe('Token invalide');
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

    describe('Gestion des Enchères', () => {
        beforeEach((done) => {
            // Authentifier avant chaque test d'enchère
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => done());
        });

        test('devrait permettre de rejoindre une enchère existante', (done) => {
            // Ce test nécessiterait une enchère existante dans la base de données
            // Pour l'instant, on teste juste que l'événement est émis
            clientSocket.emit('join_auction', { auctionId: 'test-auction-id' });
            
            clientSocket.on('auction_error', (error) => {
                // On s'attend à une erreur car l'enchère n'existe pas
                expect(error.message).toContain('Enchère non trouvée');
                done();
            });
        });

        test('devrait rejeter une tentative de rejoindre une enchère sans ID', (done) => {
            clientSocket.emit('join_auction', {});
            
            clientSocket.on('auction_error', (error) => {
                expect(error.message).toBe('ID d\'enchère manquant');
                done();
            });
        });

        test('devrait rejeter une enchère sans authentification', (done) => {
            // Créer un nouveau client non authentifié
            const unauthenticatedClient = new Client(`http://localhost:${process.env.PORT || 3000}`);
            
            unauthenticatedClient.on('connect', () => {
                unauthenticatedClient.emit('place_bid', { 
                    auctionId: 'test-auction-id', 
                    bidAmount: 100 
                });
                
                unauthenticatedClient.on('bid_error', (error) => {
                    expect(error.message).toBe('Utilisateur non authentifié');
                    unauthenticatedClient.close();
                    done();
                });
            });
        });

        test('devrait rejeter une enchère avec des données manquantes', (done) => {
            clientSocket.emit('place_bid', { auctionId: 'test-auction-id' });
            
            clientSocket.on('bid_error', (error) => {
                expect(error.message).toBe('Données d\'enchère manquantes');
                done();
            });
        });
    });

    describe('Événements Globaux', () => {
        beforeEach((done) => {
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', () => done());
        });

        test('devrait récupérer les enchères actives', (done) => {
            clientSocket.emit('get_active_auctions');
            
            clientSocket.on('active_auctions', (data) => {
                expect(data).toHaveProperty('auctions');
                expect(data).toHaveProperty('count');
                expect(Array.isArray(data.auctions)).toBe(true);
                expect(typeof data.count).toBe('number');
                done();
            });
        });
    });

    describe('Gestion des Déconnexions', () => {
        test('devrait gérer proprement les déconnexions', (done) => {
            clientSocket.emit('authenticate', { token: testToken });
            
            clientSocket.on('authenticated', () => {
                // Simuler une déconnexion
                clientSocket.disconnect();
                
                setTimeout(() => {
                    expect(clientSocket.connected).toBe(false);
                    done();
                }, 100);
            });
        });
    });
});

describe('API REST pour WebSockets', () => {
    let webServer;

    beforeAll(() => {
        webServer = new WebServer();
        webServer.start();
    });

    afterAll(() => {
        if (webServer) {
            webServer.stop();
        }
    });

    test('GET /socket/stats devrait retourner les statistiques', async () => {
        const response = await request(webServer.app)
            .get('/socket/stats')
            .expect(200);

        expect(response.body).toHaveProperty('connectedUsers');
        expect(response.body).toHaveProperty('activeAuctionRooms');
        expect(response.body).toHaveProperty('serverUptime');
        expect(response.body).toHaveProperty('timestamp');
        
        expect(typeof response.body.connectedUsers).toBe('number');
        expect(typeof response.body.activeAuctionRooms).toBe('number');
        expect(typeof response.body.serverUptime).toBe('number');
    });
});

describe('Services d\'Enchères', () => {
    const AuctionService = require('../services/auction.service');
    let auctionService;

    beforeEach(() => {
        auctionService = new AuctionService();
    });

    afterEach(() => {
        if (auctionService) {
            auctionService.cleanup();
        }
    });

    test('devrait calculer correctement le temps restant', () => {
        const futureDate = new Date(Date.now() + 3600000); // 1 heure dans le futur
        const auction = { end_date: futureDate };
        
        const timeRemaining = auctionService.getTimeRemaining(auction);
        
        expect(timeRemaining.isActive).toBe(true);
        expect(timeRemaining.milliseconds).toBeGreaterThan(0);
        expect(timeRemaining.hours).toBe(0); // Moins d'une heure mais plus de 0
        expect(timeRemaining.minutes).toBeGreaterThan(50); // Environ 60 minutes
    });

    test('devrait indiquer qu\'une enchère est terminée', () => {
        const pastDate = new Date(Date.now() - 3600000); // 1 heure dans le passé
        const auction = { end_date: pastDate };
        
        const timeRemaining = auctionService.getTimeRemaining(auction);
        
        expect(timeRemaining.isActive).toBe(false);
        expect(timeRemaining.milliseconds).toBe(0);
    });

    test('devrait valider correctement une enchère', async () => {
        // Ce test nécessiterait une base de données de test configurée
        // Pour l'instant, on teste la structure de la méthode
        const validation = await auctionService.validateBid('non-existent-auction', 'user-id', 100);
        
        expect(validation).toHaveProperty('valid');
        expect(validation).toHaveProperty('message');
        expect(validation.valid).toBe(false);
    });
});

// Tests d'intégration pour les scénarios complets
describe('Scénarios d\'Intégration WebSocket', () => {
    let webServer;
    let client1, client2;
    let testToken1, testToken2;

    beforeAll(() => {
        webServer = new WebServer();
        webServer.start();

        // Créer des tokens pour deux utilisateurs différents
        testToken1 = jwt.sign({ id: 'user1', email: 'user1@test.com' }, process.env.SECRET_KEY || 'test-secret');
        testToken2 = jwt.sign({ id: 'user2', email: 'user2@test.com' }, process.env.SECRET_KEY || 'test-secret');
    });

    afterAll(() => {
        if (webServer) {
            webServer.stop();
        }
    });

    beforeEach((done) => {
        let connectionsCount = 0;
        
        client1 = new Client(`http://localhost:${process.env.PORT || 3000}`);
        client2 = new Client(`http://localhost:${process.env.PORT || 3000}`);
        
        const checkConnections = () => {
            connectionsCount++;
            if (connectionsCount === 2) done();
        };
        
        client1.on('connect', checkConnections);
        client2.on('connect', checkConnections);
    });

    afterEach(() => {
        if (client1) client1.close();
        if (client2) client2.close();
    });

    test('devrait permettre à plusieurs utilisateurs de se connecter simultanément', (done) => {
        let authenticatedCount = 0;
        
        const checkAuthentications = () => {
            authenticatedCount++;
            if (authenticatedCount === 2) {
                done();
            }
        };
        
        client1.emit('authenticate', { token: testToken1 });
        client2.emit('authenticate', { token: testToken2 });
        
        client1.on('authenticated', checkAuthentications);
        client2.on('authenticated', checkAuthentications);
    });
});
