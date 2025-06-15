# 🧪 Guide Complet de Test - DropTheStreet API

## 🎯 Vue d'Ensemble

Ce guide vous explique comment exécuter, créer et maintenir tous les tests pour l'API DropTheStreet, incluant les tests unitaires, d'intégration et manuels.

## 🚀 Démarrage Rapide

### Installation des Dépendances de Test
```bash
npm install --save-dev jest supertest socket.io-client
```

### Exécution des Tests
```bash
# Tous les tests
npm test

# Tests WebSocket uniquement
npm run test:websocket

# Tests avec surveillance
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

## 📁 Structure des Tests

```
src/tests/
├── websocket.test.js       # Tests WebSocket généraux ✅
├── chat.test.js           # Tests spécifiques au chat ✅
├── auction.test.js        # Tests enchères (à créer)
├── auth.test.js          # Tests authentification (à créer)
└── integration.test.js   # Tests d'intégration (à créer)

test-files/
├── test-websocket-client.html  # Client de test manuel ✅
├── test-simple-websocket.js    # Serveur test sans BDD ✅
└── test-chat-only.js          # Serveur test chat seul ✅
```

## 🧪 Tests Automatisés

### 1. Tests WebSocket Généraux (`websocket.test.js`)

**Couverture :**
- ✅ Connexion WebSocket
- ✅ Authentification JWT
- ✅ Gestion des erreurs d'auth
- ✅ Déconnexions propres
- ✅ Événements d'enchères de base

**Exécution :**
```bash
npx jest src/tests/websocket.test.js
```

### 2. Tests de Chat (`chat.test.js`)

**Couverture :**
- ✅ Authentification mode test
- ✅ Rejoindre/quitter le chat
- ✅ Envoi de messages
- ✅ Validation des messages
- ✅ Historique du chat
- ✅ Statistiques
- ✅ Événements multi-utilisateurs
- ✅ Gestion des erreurs

**Exécution :**
```bash
npx jest src/tests/chat.test.js
```

**Exemple de test :**
```javascript
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
```

### 3. Tests à Créer

#### Tests d'Enchères (`auction.test.js`)
```bash
# Créer le fichier
touch src/tests/auction.test.js
```

**Tests nécessaires :**
- Rejoindre une enchère
- Placer des enchères
- Validation des montants
- Fin automatique d'enchères
- Notifications des participants

#### Tests d'Authentification (`auth.test.js`)
```bash
# Créer le fichier
touch src/tests/auth.test.js
```

**Tests nécessaires :**
- Validation JWT
- Mode test vs production
- Gestion des utilisateurs inexistants
- Expiration des tokens

## 🔧 Tests Manuels

### 1. Client de Test HTML

**Fichier :** `test-websocket-client.html`

**Utilisation :**
1. Démarrer le serveur : `npm run start:websocket:dev`
2. Ouvrir le fichier HTML dans un navigateur
3. Se connecter à `http://localhost:3000`
4. Tester toutes les fonctionnalités

**Fonctionnalités testables :**
- ✅ Connexion WebSocket
- ✅ Authentification (token `test`)
- ✅ Chat général (rejoindre, messages, quitter)
- ✅ Enchères (rejoindre, enchérir, quitter)
- ✅ Statistiques temps réel

### 2. Serveurs de Test

#### Serveur Simple (`test-simple-websocket.js`)
```bash
node test-simple-websocket.js
```
- **Usage :** Test sans base de données
- **Fonctionnalités :** Enchères et chat simulés
- **Avantage :** Pas de dépendances externes

#### Serveur Chat Seul (`test-chat-only.js`)
```bash
node test-chat-only.js
```
- **Usage :** Test du chat uniquement
- **Fonctionnalités :** Chat en mémoire
- **Avantage :** Focus sur le chat

## 📊 Couverture de Code

### Objectifs
- **Lignes :** > 80%
- **Fonctions :** > 85%
- **Branches :** > 75%
- **Statements :** > 80%

### Génération du Rapport
```bash
npm run test:coverage
```

### Visualisation
```bash
# Ouvrir le rapport HTML
open coverage/lcov-report/index.html
```

### Fichiers Critiques à Couvrir
- `src/core/socket-handler.js`
- `src/controllers/chat/chat-socket.controller.js`
- `src/controllers/auction/auction-socket.controller.js`
- `src/services/auction.service.js`

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

### Tests avec Timeout Étendu
```javascript
test('test long', (done) => {
    // Code du test
}, 10000); // 10 secondes
```

### Mode Debug Jest
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Variables d'Environnement de Test
```bash
# Dans .env.test
NODE_ENV=test
PORT=3001
DB_NAME=dropthestreet_test
SECRET_KEY=test_secret_key
```

## 🔄 Intégration Continue

### GitHub Actions (`.github/workflows/test.yml`)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

## 📝 Écriture de Nouveaux Tests

### Template de Test WebSocket
```javascript
describe('Nouveau Test', () => {
    let clientSocket, testToken;

    beforeAll(() => {
        testToken = 'test123';
    });

    beforeEach((done) => {
        clientSocket = new Client('http://localhost:3000');
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket) clientSocket.close();
    });

    test('devrait faire quelque chose', (done) => {
        // Arrange
        clientSocket.emit('authenticate', { token: testToken });
        
        // Act & Assert
        clientSocket.on('authenticated', () => {
            clientSocket.emit('action_to_test', { data: 'test' });
            
            clientSocket.on('expected_response', (data) => {
                expect(data).toBeDefined();
                done();
            });
        });
    });
});
```

### Bonnes Pratiques
1. **Un test = une fonctionnalité**
2. **Noms descriptifs** : `devrait rejeter un message vide`
3. **Isolation** : Chaque test indépendant
4. **Nettoyage** : `afterEach` pour nettoyer
5. **Timeout** : Gérer les tests asynchrones

## 🎯 Scénarios de Test Prioritaires

### Tests Critiques (Priorité 1)
- ✅ Authentification WebSocket
- ✅ Envoi/réception de messages chat
- ⏳ Placement d'enchères
- ⏳ Fin automatique d'enchères

### Tests Importants (Priorité 2)
- ✅ Gestion des déconnexions
- ✅ Validation des données
- ⏳ Performance avec multiple utilisateurs
- ⏳ Gestion des erreurs de BDD

### Tests Optionnels (Priorité 3)
- ⏳ Tests de charge
- ⏳ Tests de sécurité
- ⏳ Tests de compatibilité navigateurs

## 📈 Métriques de Performance

### Temps d'Exécution Cibles
- **Tests unitaires :** < 5 secondes
- **Tests d'intégration :** < 30 secondes
- **Suite complète :** < 2 minutes

### Surveillance
```bash
# Mesurer le temps d'exécution
time npm test

# Tests avec profiling
npm test -- --verbose --detectOpenHandles
```

## 🚨 Résolution de Problèmes

### Tests qui Échouent
1. **Vérifier les logs** : `npm test -- --verbose`
2. **Isoler le test** : `npx jest -t "nom du test"`
3. **Vérifier l'environnement** : Variables, ports, BDD
4. **Nettoyer** : `npm run test:clean` (si disponible)

### Problèmes Courants
- **Port occupé :** Changer le port de test
- **Timeout :** Augmenter le timeout des tests
- **Mémoire :** Nettoyer les sockets après tests
- **BDD :** Utiliser des mocks ou BDD de test

### Commandes de Diagnostic
```bash
# Vérifier les processus Node
ps aux | grep node

# Vérifier les ports utilisés
netstat -tulpn | grep :3000

# Nettoyer les processus
pkill -f node
```

## 📞 Support

### Documentation
- `PROJECT_DOCUMENTATION.md` - Documentation complète
- `UNIT_TESTS_DOCUMENTATION.md` - Tests détaillés
- `WEBSOCKET_DOCUMENTATION.md` - API WebSocket

### Aide
- Logs détaillés dans la console
- Client de test HTML pour validation manuelle
- Serveurs de test pour isolation des problèmes

---

**Guide de test mis à jour le :** [Date actuelle]  
**Version Jest :** 29+  
**Couverture actuelle :** En développement
