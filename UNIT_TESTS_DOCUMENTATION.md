# 🧪 Documentation des Tests Unitaires - DropTheStreet API

## 🎯 Vue d'Ensemble des Tests

Cette documentation couvre tous les tests unitaires et d'intégration pour le système WebSocket de DropTheStreet API. Les tests sont organisés par fonctionnalité et utilisent Jest comme framework principal.

## 📁 Structure des Tests

```
src/tests/
├── websocket.test.js           # Tests WebSocket principaux
├── chat.test.js               # Tests spécifiques au chat (à créer)
├── auction.test.js            # Tests spécifiques aux enchères (à créer)
├── auth.test.js               # Tests d'authentification (à créer)
└── integration.test.js        # Tests d'intégration (à créer)

test-files/
├── test-websocket-client.html  # Client de test manuel
├── test-simple-websocket.js    # Serveur de test sans BDD
└── test-chat-only.js          # Serveur de test chat uniquement
```

## 🔧 Configuration des Tests

### Installation des Dépendances de Test
```bash
npm install --save-dev jest supertest socket.io-client
```

### Configuration Jest (package.json)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:websocket": "jest src/tests/websocket.test.js",
    "test:verbose": "jest --verbose"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/tests/**",
      "!node_modules/**"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"]
  }
}
```

## 🧪 Tests WebSocket Existants

### Fichier: `src/tests/websocket.test.js`

#### Tests de Connexion et Authentification
```javascript
describe('WebSocket Tests', () => {
    describe('Connexion et Authentification', () => {
        test('devrait se connecter au serveur WebSocket')
        test('devrait authentifier un utilisateur avec un token valide')
        test('devrait rejeter un token invalide')
        test('devrait rejeter une authentification sans token')
    });
});
```

#### Tests de Gestion des Enchères
```javascript
describe('Gestion des Enchères', () => {
    test('devrait permettre de rejoindre une enchère existante')
    test('devrait rejeter une tentative de rejoindre une enchère sans ID')
    test('devrait rejeter une enchère sans authentification')
    test('devrait rejeter une enchère avec des données manquantes')
});
```

#### Tests d'Événements Globaux
```javascript
describe('Événements Globaux', () => {
    test('devrait récupérer les enchères actives')
});
```

#### Tests de Déconnexion
```javascript
describe('Gestion des Déconnexions', () => {
    test('devrait gérer proprement les déconnexions')
});
```

## 📝 Tests à Créer

### 1. Tests de Chat (`src/tests/chat.test.js`)

```javascript
const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const WebServer = require('../core/web-server');

describe('Tests de Chat', () => {
    let webServer, clientSocket, testToken;

    beforeAll(async () => {
        webServer = new WebServer();
        webServer.start();
        testToken = 'test123'; // Token de test
    });

    afterAll(() => {
        if (webServer) webServer.stop();
    });

    beforeEach((done) => {
        clientSocket = new Client(`http://localhost:${process.env.PORT || 3000}`);
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket) clientSocket.close();
    });

    describe('Authentification Chat', () => {
        test('devrait authentifier avec un token de test', (done) => {
            clientSocket.emit('authenticate', { token: testToken });
            clientSocket.on('authenticated', (data) => {
                expect(data.user).toBeDefined();
                expect(data.user.email).toContain('test-');
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
                expect(data.timestamp).toBeDefined();
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

        test('devrait rejeter un message trop long', (done) => {
            const longMessage = 'a'.repeat(1001);
            
            clientSocket.emit('send_general_message', { text: longMessage });
            clientSocket.on('chat_error', (error) => {
                expect(error.message).toContain('trop long');
                done();
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
                done();
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
                expect(data.onlineParticipants).toBeDefined();
                expect(typeof data.totalMessages).toBe('number');
                done();
            });
        });
    });
});
```

### 2. Tests d'Enchères (`src/tests/auction.test.js`)

```javascript
describe('Tests d\'Enchères WebSocket', () => {
    describe('Rejoindre une Enchère', () => {
        test('devrait rejoindre une enchère valide')
        test('devrait rejeter une enchère inexistante')
        test('devrait rejeter une enchère terminée')
        test('devrait compter les participants correctement')
    });

    describe('Placer des Enchères', () => {
        test('devrait placer une enchère valide')
        test('devrait rejeter une enchère inférieure au prix actuel')
        test('devrait rejeter une enchère de l\'owner')
        test('devrait notifier les autres participants')
    });

    describe('Fin d\'Enchères', () => {
        test('devrait détecter la fin automatique d\'une enchère')
        test('devrait notifier le gagnant')
        test('devrait nettoyer la salle d\'enchère')
    });
});
```

### 3. Tests d'Authentification (`src/tests/auth.test.js`)

```javascript
describe('Tests d\'Authentification', () => {
    describe('Tokens JWT', () => {
        test('devrait valider un token JWT valide')
        test('devrait rejeter un token expiré')
        test('devrait rejeter un token malformé')
        test('devrait rejeter un token avec une signature invalide')
    });

    describe('Mode Test', () => {
        test('devrait accepter le token "test"')
        test('devrait accepter le token "test123"')
        test('devrait créer un utilisateur fictif')
        test('devrait assigner des propriétés au socket')
    });

    describe('Utilisateurs Réels', () => {
        test('devrait authentifier un utilisateur existant')
        test('devrait rejeter un utilisateur inexistant')
        test('devrait récupérer les bonnes informations utilisateur')
    });
});
```

### 4. Tests d'Intégration (`src/tests/integration.test.js`)

```javascript
describe('Tests d\'Intégration', () => {
    describe('Scénario Complet Chat', () => {
        test('devrait permettre une conversation complète entre deux utilisateurs')
        test('devrait gérer les déconnexions pendant une conversation')
        test('devrait maintenir l\'historique après reconnexion')
    });

    describe('Scénario Complet Enchères', () => {
        test('devrait permettre une enchère complète avec plusieurs participants')
        test('devrait gérer la fin d\'enchère avec un gagnant')
        test('devrait notifier tous les participants de la fin')
    });

    describe('Performance', () => {
        test('devrait gérer 100 connexions simultanées')
        test('devrait traiter 1000 messages en moins de 5 secondes')
        test('devrait nettoyer automatiquement les ressources')
    });
});
```

## 🚀 Commandes de Test

### Tests Basiques
```bash
# Tous les tests
npm test

# Tests avec surveillance des changements
npm run test:watch

# Tests avec couverture de code
npm run test:coverage

# Tests spécifiques
npm run test:websocket
```

### Tests Avancés
```bash
# Tests verbeux avec détails
npm run test:verbose

# Tests d'un fichier spécifique
npx jest src/tests/chat.test.js

# Tests avec pattern
npx jest --testNamePattern="Chat"

# Tests en mode debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📊 Couverture de Code

### Objectifs de Couverture
- **Lignes :** > 80%
- **Fonctions :** > 85%
- **Branches :** > 75%
- **Statements :** > 80%

### Rapport de Couverture
```bash
npm run test:coverage
```

Génère un rapport dans `coverage/lcov-report/index.html`

## 🔍 Tests Manuels

### Client de Test HTML
```bash
# Démarrer le serveur
npm run start:websocket:dev

# Ouvrir test-websocket-client.html dans le navigateur
# Tester manuellement toutes les fonctionnalités
```

### Serveurs de Test
```bash
# Test sans base de données
node test-simple-websocket.js

# Test chat uniquement
node test-chat-only.js
```

## 🐛 Débogage des Tests

### Logs de Débogage
```javascript
// Dans les tests
console.log('État du socket:', {
    id: socket.id,
    authenticated: socket.authenticated,
    rooms: Array.from(socket.rooms)
});
```

### Tests avec Timeout
```javascript
// Pour les tests WebSocket longs
test('test long', (done) => {
    // Test code
}, 10000); // 10 secondes timeout
```

### Mock des Services
```javascript
// Mock du repository
jest.mock('../../models/repositories/chat/general_chat-repository', () => ({
    create: jest.fn(),
    getChatHistory: jest.fn(),
    findById: jest.fn()
}));
```

## 📈 Métriques de Test

### Temps d'Exécution
- Tests unitaires : < 5 secondes
- Tests d'intégration : < 30 secondes
- Tests complets : < 2 minutes

### Critères de Succès
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Pas de fuites mémoire
- ✅ Performance acceptable

## 🔄 CI/CD et Tests

### GitHub Actions (exemple)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### Scripts Pre-commit
```bash
# Ajouter dans package.json
"husky": {
  "hooks": {
    "pre-commit": "npm test"
  }
}
```

## 📝 Bonnes Pratiques

### Structure des Tests
1. **Arrange** - Préparer les données
2. **Act** - Exécuter l'action
3. **Assert** - Vérifier le résultat

### Nommage
- Tests descriptifs : `devrait rejeter un message vide`
- Groupement logique avec `describe`
- Un test = une fonctionnalité

### Isolation
- Chaque test doit être indépendant
- Nettoyer après chaque test
- Utiliser `beforeEach` et `afterEach`

### Assertions
- Utiliser des assertions spécifiques
- Tester les cas d'erreur
- Vérifier les effets de bord

---

**Documentation des tests mise à jour le :** [Date actuelle]  
**Framework de test :** Jest v29+  
**Couverture actuelle :** En cours de développement
