# 📚 Documentation Complète - DropTheStreet API WebSocket

## 🎯 Vue d'Ensemble du Projet

DropTheStreet API est une application Node.js avec Express qui fournit des fonctionnalités d'enchères en temps réel et de chat général via WebSockets. Le projet utilise Socket.IO pour la communication temps réel, Sequelize pour l'ORM, et MySQL pour la base de données.

## 🏗️ Architecture du Projet

### Structure des Dossiers
```
DropTheStreet-API/
├── src/
│   ├── core/                          # Cœur de l'application
│   │   ├── web-server.js              # Serveur principal Express + WebSocket
│   │   ├── socket-handler.js          # Gestionnaire principal des WebSockets
│   │   └── mysql.db.js                # Configuration base de données
│   ├── controllers/                   # Contrôleurs
│   │   ├── auction/                   # Contrôleurs d'enchères
│   │   │   ├── auction.routes.js      # Routes REST enchères
│   │   │   ├── auction-socket.controller.js  # Contrôleur WebSocket enchères
│   │   │   └── history_auction.routes.js     # Routes historique enchères
│   │   ├── chat/                      # Contrôleurs de chat
│   │   │   ├── chat.routes.js         # Routes REST chat
│   │   │   └── chat-socket.controller.js     # Contrôleur WebSocket chat
│   │   └── [autres contrôleurs...]
│   ├── models/                        # Modèles et repositories
│   │   ├── models/                    # Modèles Sequelize
│   │   │   ├── auction/               # Modèles d'enchères
│   │   │   ├── chat/                  # Modèles de chat
│   │   │   ├── user/                  # Modèles utilisateur
│   │   │   └── [autres modèles...]
│   │   └── repositories/              # Repositories (couche d'accès aux données)
│   │       ├── auction/               # Repositories enchères
│   │       ├── chat/                  # Repositories chat
│   │       └── [autres repositories...]
│   ├── services/                      # Services métier
│   │   └── auction.service.js         # Service de gestion des enchères
│   └── tests/                         # Tests unitaires
│       └── websocket.test.js          # Tests WebSocket
├── test-files/                        # Fichiers de test
│   ├── test-websocket-client.html     # Client de test HTML
│   ├── test-simple-websocket.js       # Serveur de test simplifié
│   └── test-chat-only.js              # Serveur de test chat uniquement
├── docs/                              # Documentation
│   ├── WEBSOCKET_DOCUMENTATION.md     # Doc WebSocket complète
│   ├── README_WEBSOCKETS.md           # Guide de démarrage WebSocket
│   ├── CHAT_FEATURES_SUMMARY.md       # Résumé fonctionnalités chat
│   ├── DEBUG_CHAT_GUIDE.md            # Guide de débogage
│   └── TROUBLESHOOTING.md             # Guide de dépannage
├── package.json                       # Dépendances et scripts
├── .env                              # Variables d'environnement
└── index.js                          # Point d'entrée principal
```

## 🔧 Technologies Utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Socket.IO** - WebSockets temps réel
- **Sequelize** - ORM pour base de données
- **MySQL/MariaDB** - Base de données relationnelle
- **JWT** - Authentification par tokens
- **UUID** - Génération d'identifiants uniques

### Frontend (Tests)
- **HTML5** - Interface de test
- **JavaScript Vanilla** - Client WebSocket de test
- **Socket.IO Client** - Connexion WebSocket côté client

### Tests
- **Jest** - Framework de tests unitaires
- **Supertest** - Tests d'API REST
- **Socket.IO Client** - Tests WebSocket

## 🚀 Installation et Configuration

### Prérequis
- Node.js (v16 ou supérieur)
- MySQL ou MariaDB
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone [url-du-repo]
cd DropTheStreet-API

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres
```

### Configuration .env
```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dropthestreet
DB_USER=root
DB_PASSWORD=

# JWT
SECRET_KEY=votre_clé_secrète_très_longue_et_sécurisée

# WebSocket
WEBSOCKET_CORS_ORIGIN=*
```

### Démarrage
```bash
# Démarrage normal
npm start

# Démarrage avec WebSockets
npm run start:websocket

# Démarrage en mode développement
npm run start:websocket:dev

# Tests
npm test
npm run test:websocket
```

## 📊 Base de Données

### Modèles Principaux

#### User
```sql
CREATE TABLE User (
    id_user VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    pseudo VARCHAR(100),
    photo VARCHAR(500),
    password VARCHAR(255),
    createdAt DATETIME,
    updatedAt DATETIME
);
```

#### Auction
```sql
CREATE TABLE Auction (
    id_auction VARCHAR(36) PRIMARY KEY,
    initial_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    start_date DATETIME,
    end_date DATETIME,
    id_user VARCHAR(36),
    id_product VARCHAR(36),
    createdAt DATETIME,
    updatedAt DATETIME,
    FOREIGN KEY (id_user) REFERENCES User(id_user),
    FOREIGN KEY (id_product) REFERENCES Product(id_product)
);
```

#### GeneralChat
```sql
CREATE TABLE GeneralChat (
    id_message VARCHAR(36) PRIMARY KEY,
    message TEXT NOT NULL,
    id_user VARCHAR(36) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    edited_at DATETIME,
    createdAt DATETIME,
    updatedAt DATETIME,
    FOREIGN KEY (id_user) REFERENCES User(id_user)
);
```

#### HistoryAuction
```sql
CREATE TABLE HistoryAuction (
    id_history_auction VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10,2),
    id_user VARCHAR(36),
    id_auction VARCHAR(36),
    createdAt DATETIME,
    updatedAt DATETIME,
    FOREIGN KEY (id_user) REFERENCES User(id_user),
    FOREIGN KEY (id_auction) REFERENCES Auction(id_auction)
);
```

### Relations
- **User** ↔ **Auction** (1:N) - Un utilisateur peut créer plusieurs enchères
- **User** ↔ **HistoryAuction** (1:N) - Un utilisateur peut placer plusieurs enchères
- **User** ↔ **GeneralChat** (1:N) - Un utilisateur peut envoyer plusieurs messages
- **Auction** ↔ **HistoryAuction** (1:N) - Une enchère peut avoir plusieurs offres

## 🔌 API WebSocket

### Événements d'Authentification
```javascript
// Côté client
socket.emit('authenticate', { token: 'jwt_token' });

// Réponses
socket.on('authenticated', (data) => { /* succès */ });
socket.on('authentication_error', (error) => { /* échec */ });
```

### Événements d'Enchères
```javascript
// Rejoindre une enchère
socket.emit('join_auction', { auctionId: 'uuid' });
socket.on('auction_joined', (data) => { /* confirmé */ });

// Placer une enchère
socket.emit('place_bid', { auctionId: 'uuid', bidAmount: 150.00 });
socket.on('bid_placed', (data) => { /* confirmé */ });
socket.on('new_bid', (data) => { /* nouvelle enchère reçue */ });

// Quitter une enchère
socket.emit('leave_auction', { auctionId: 'uuid' });
socket.on('auction_left', (data) => { /* confirmé */ });

// Enchères actives
socket.emit('get_active_auctions');
socket.on('active_auctions', (data) => { /* liste reçue */ });

// Fin d'enchère
socket.on('auction_ended', (data) => { /* enchère terminée */ });
socket.on('auction_won', (data) => { /* vous avez gagné */ });
```

### Événements de Chat
```javascript
// Rejoindre le chat général
socket.emit('join_general_chat');
socket.on('general_chat_joined', (data) => { /* confirmé */ });

// Envoyer un message
socket.emit('send_general_message', { text: 'Hello world' });
socket.on('new_general_message', (data) => { /* nouveau message */ });

// Historique
socket.emit('get_general_chat_history', { limit: 50, offset: 0 });
socket.on('general_chat_history', (data) => { /* historique reçu */ });

// Modifier/Supprimer
socket.emit('edit_message', { messageId: 'uuid', newText: 'Nouveau texte' });
socket.emit('delete_message', { messageId: 'uuid' });
socket.on('message_edited', (data) => { /* message modifié */ });
socket.on('message_deleted', (data) => { /* message supprimé */ });

// Recherche
socket.emit('search_messages', { query: 'terme', limit: 20 });
socket.on('search_results', (data) => { /* résultats */ });

// Statistiques
socket.emit('get_chat_stats');
socket.on('chat_stats', (data) => { /* statistiques */ });

// Quitter le chat
socket.emit('leave_general_chat');
socket.on('general_chat_left', (data) => { /* confirmé */ });
```

### Gestion des Erreurs
```javascript
socket.on('auction_error', (error) => { /* erreur d'enchère */ });
socket.on('bid_error', (error) => { /* erreur d'enchère */ });
socket.on('chat_error', (error) => { /* erreur de chat */ });
socket.on('auctions_error', (error) => { /* erreur de récupération */ });
```

## 🌐 API REST

### Endpoints d'Enchères
```
GET    /auction              # Liste des enchères
POST   /auction              # Créer une enchère
GET    /auction/:id          # Détails d'une enchère
PUT    /auction/:id          # Modifier une enchère
DELETE /auction/:id          # Supprimer une enchère

GET    /history-auction      # Historique des enchères
POST   /history-auction      # Ajouter une enchère à l'historique
```

### Endpoints de Chat
```
GET    /chat/history         # Historique des messages
GET    /chat/stats           # Statistiques du chat
GET    /chat/search          # Recherche de messages
GET    /chat/recent          # Messages récents
POST   /chat/seeder          # Créer des messages de test
POST   /chat/message         # Créer un message via REST
DELETE /chat/:messageId      # Supprimer un message (admin)
```

### Endpoints de Monitoring
```
GET    /socket/stats         # Statistiques WebSocket
```

## 🔒 Sécurité

### Authentification
- **JWT Tokens** - Authentification stateless
- **Validation côté serveur** - Toutes les entrées sont validées
- **Mode test** - Tokens `test` et `test123` pour le développement

### Protection WebSocket
- **Authentification obligatoire** - Pour toutes les actions sensibles
- **Rate limiting** - Anti-spam (10 messages/minute par utilisateur)
- **Validation des données** - Longueur, format, contenu
- **Isolation des salles** - Les utilisateurs ne reçoivent que leurs données

### CORS
```javascript
cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}
```

## ⚡ Performance

### Optimisations WebSocket
- **Salles par enchère** - Évite la diffusion globale
- **Nettoyage automatique** - Suppression des salles vides
- **Données JSON propres** - Évite les références circulaires
- **Pagination** - Historique des messages paginé

### Optimisations Base de Données
- **Index sur les clés étrangères** - Performance des jointures
- **Soft delete** - Messages marqués comme supprimés
- **Requêtes optimisées** - Sélection des champs nécessaires uniquement

### Monitoring
- **Logs détaillés** - Débogage et monitoring
- **Statistiques temps réel** - Utilisateurs connectés, messages, enchères
- **Gestion des timers** - Fin automatique des enchères

## 🧪 Tests et Débogage

### Fichiers de Test
- **test-websocket-client.html** - Interface de test complète
- **test-simple-websocket.js** - Serveur de test sans BDD
- **test-chat-only.js** - Test du chat uniquement

### Commandes de Test
```bash
npm test                    # Tous les tests
npm run test:websocket      # Tests WebSocket uniquement
node test-simple-websocket.js  # Serveur de test
```

### Débogage
- **Logs détaillés** - Chaque étape est loggée
- **Mode test** - Authentification simplifiée
- **Client HTML** - Test interactif des fonctionnalités
- **Stack traces** - Erreurs détaillées

## 📈 Évolutions Futures

### Fonctionnalités Prévues
- [ ] Chat privé entre utilisateurs
- [ ] Notifications push
- [ ] Enchères automatiques (bots)
- [ ] Modération du chat
- [ ] Historique des connexions
- [ ] Métriques avancées

### Améliorations Techniques
- [ ] Support Redis pour le clustering
- [ ] Rate limiting par utilisateur
- [ ] Compression des messages WebSocket
- [ ] Reconnexion automatique côté client
- [ ] Tests d'intégration complets

## 📞 Support et Maintenance

### Logs à Surveiller
- Erreurs d'authentification
- Échecs de connexion WebSocket
- Erreurs de base de données
- Performance des requêtes

### Métriques Importantes
- Nombre d'utilisateurs connectés
- Messages par minute
- Enchères actives
- Temps de réponse

### Dépannage Courant
- Voir `TROUBLESHOOTING.md`
- Voir `DEBUG_CHAT_GUIDE.md`
- Vérifier les logs du serveur
- Tester avec le client HTML

---

**Documentation mise à jour le :** [Date actuelle]  
**Version de l'API :** 1.0.0  
**Auteur :** Équipe DropTheStreet
