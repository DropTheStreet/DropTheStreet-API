# Documentation WebSocket - DropTheStreet API

## Vue d'ensemble

Cette API utilise Socket.IO pour fournir des fonctionnalités en temps réel pour le système d'enchères. Les WebSockets permettent aux utilisateurs de recevoir des mises à jour instantanées sur les enchères, de placer des enchères en temps réel, et de recevoir des notifications.

## Configuration

### Côté Serveur

Le serveur WebSocket est automatiquement démarré avec l'application Express. Il écoute sur le même port que l'API REST.

```javascript
// Le serveur WebSocket est configuré avec CORS
const io = socketIo(server, { 
    cors: { 
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    } 
});
```

### Côté Client

Pour se connecter au serveur WebSocket :

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling']
});
```

## Authentification

Avant d'utiliser les fonctionnalités d'enchères, les clients doivent s'authentifier :

```javascript
// Envoyer le token JWT pour l'authentification
socket.emit('authenticate', {
    token: 'votre_jwt_token_ici'
});

// Écouter la confirmation d'authentification
socket.on('authenticated', (data) => {
    console.log('Authentifié avec succès:', data);
});

// Gérer les erreurs d'authentification
socket.on('authentication_error', (error) => {
    console.error('Erreur d\'authentification:', error);
});
```

## Événements WebSocket

### Événements Émis par le Client

#### 1. Authentification
```javascript
socket.emit('authenticate', {
    token: 'jwt_token'
});
```

#### 2. Rejoindre une enchère
```javascript
socket.emit('join_auction', {
    auctionId: 'uuid_de_l_enchere'
});
```

#### 3. Quitter une enchère
```javascript
socket.emit('leave_auction', {
    auctionId: 'uuid_de_l_enchere'
});
```

#### 4. Placer une enchère
```javascript
socket.emit('place_bid', {
    auctionId: 'uuid_de_l_enchere',
    bidAmount: 150.00
});
```

#### 5. Obtenir les enchères actives
```javascript
socket.emit('get_active_auctions');
```

#### 6. Rejoindre le chat général
```javascript
socket.emit('join_general_chat');
```

#### 7. Quitter le chat général
```javascript
socket.emit('leave_general_chat');
```

#### 8. Récupérer l'historique du chat
```javascript
socket.emit('get_general_chat_history', {
    limit: 50,
    offset: 0
});
```

#### 9. Envoyer un message dans le chat général
```javascript
socket.emit('send_general_message', {
    text: 'Votre message ici'
});
```

#### 10. Modifier un message
```javascript
socket.emit('edit_message', {
    messageId: 'uuid-du-message',
    newText: 'Nouveau texte du message'
});
```

#### 11. Supprimer un message
```javascript
socket.emit('delete_message', {
    messageId: 'uuid-du-message'
});
```

#### 12. Rechercher des messages
```javascript
socket.emit('search_messages', {
    query: 'terme de recherche',
    limit: 20
});
```

#### 13. Obtenir les statistiques du chat
```javascript
socket.emit('get_chat_stats');
```

### Événements Reçus par le Client

#### 1. Authentification réussie
```javascript
socket.on('authenticated', (data) => {
    // data.user contient les informations de l'utilisateur
});
```

#### 2. Enchère rejointe avec succès
```javascript
socket.on('auction_joined', (data) => {
    // data.auction contient les détails de l'enchère
    // data.participantCount contient le nombre de participants
});
```

#### 3. Nouvelle enchère placée
```javascript
socket.on('new_bid', (data) => {
    // data.bidAmount - montant de la nouvelle enchère
    // data.userId - ID de l'utilisateur qui a enchéri
    // data.currentPrice - nouveau prix actuel
});
```

#### 4. Enchère placée avec succès (confirmation)
```javascript
socket.on('bid_placed', (data) => {
    // Confirmation que votre enchère a été acceptée
});
```

#### 5. Enchère terminée
```javascript
socket.on('auction_ended', (data) => {
    // data.finalPrice - prix final
    // data.winner - informations du gagnant (si applicable)
});
```

#### 6. Enchère remportée
```javascript
socket.on('auction_won', (data) => {
    // Notification spéciale pour le gagnant
});
```

#### 7. Utilisateur rejoint/quitte l'enchère
```javascript
socket.on('user_joined_auction', (data) => {
    // data.userId, data.participantCount
});

socket.on('user_left_auction', (data) => {
    // data.userId, data.participantCount
});
```

#### 8. Temps restant
```javascript
socket.on('time_remaining', (data) => {
    // data.timeRemaining - temps en millisecondes
    // data.isActive - booléen indiquant si l'enchère est active
});
```

#### 9. Enchères actives
```javascript
socket.on('active_auctions', (data) => {
    // data.auctions - tableau des enchères actives
    // data.count - nombre d'enchères actives
});
```

#### 10. Nouvelle enchère créée
```javascript
socket.on('new_auction_created', (data) => {
    // Notification globale d'une nouvelle enchère
});
```

#### 11. Chat général rejoint
```javascript
socket.on('general_chat_joined', (data) => {
    // data.message, data.participantCount
});
```

#### 12. Chat général quitté
```javascript
socket.on('general_chat_left', (data) => {
    // data.message
});
```

#### 13. Historique du chat
```javascript
socket.on('general_chat_history', (data) => {
    // data.messages - tableau des messages
    // data.hasMore - booléen indiquant s'il y a plus de messages
});
```

#### 14. Nouveau message dans le chat
```javascript
socket.on('new_general_message', (data) => {
    // data.id_message, data.message, data.user, data.timestamp
});
```

#### 15. Utilisateur rejoint/quitte le chat
```javascript
socket.on('user_joined_chat', (data) => {
    // data.userId, data.pseudo, data.participantCount
});

socket.on('user_left_chat', (data) => {
    // data.userId, data.participantCount
});
```

#### 16. Message modifié
```javascript
socket.on('message_edited', (data) => {
    // data.id_message, data.message, data.user, data.edited_at
});
```

#### 17. Message supprimé
```javascript
socket.on('message_deleted', (data) => {
    // data.messageId
});
```

#### 18. Résultats de recherche
```javascript
socket.on('search_results', (data) => {
    // data.query, data.results
});
```

#### 19. Statistiques du chat
```javascript
socket.on('chat_stats', (data) => {
    // data.totalMessages, data.todayMessages, data.activeUsers, data.onlineParticipants
});
```

### Événements d'Erreur

```javascript
socket.on('auction_error', (error) => {
    console.error('Erreur d\'enchère:', error.message);
});

socket.on('bid_error', (error) => {
    console.error('Erreur d\'enchère:', error.message);
});

socket.on('auctions_error', (error) => {
    console.error('Erreur de récupération:', error.message);
});

socket.on('chat_error', (error) => {
    console.error('Erreur de chat:', error.message);
});
```

## Exemple d'Utilisation Complète

```javascript
import io from 'socket.io-client';

class AuctionClient {
    constructor(serverUrl, token) {
        this.socket = io(serverUrl);
        this.token = token;
        this.setupEventListeners();
        this.authenticate();
    }

    authenticate() {
        this.socket.emit('authenticate', { token: this.token });
    }

    joinAuction(auctionId) {
        this.socket.emit('join_auction', { auctionId });
    }

    placeBid(auctionId, bidAmount) {
        this.socket.emit('place_bid', { auctionId, bidAmount });
    }

    setupEventListeners() {
        this.socket.on('authenticated', (data) => {
            console.log('Connecté en tant que:', data.user.email);
        });

        this.socket.on('auction_joined', (data) => {
            console.log('Enchère rejointe:', data.auction);
            this.displayAuction(data.auction);
        });

        this.socket.on('new_bid', (data) => {
            console.log('Nouvelle enchère:', data);
            this.updatePrice(data.currentPrice);
        });

        this.socket.on('auction_ended', (data) => {
            console.log('Enchère terminée:', data);
            this.showAuctionResult(data);
        });

        this.socket.on('bid_error', (error) => {
            alert('Erreur: ' + error.message);
        });
    }

    displayAuction(auction) {
        // Logique d'affichage de l'enchère
    }

    updatePrice(newPrice) {
        // Logique de mise à jour du prix
    }

    showAuctionResult(result) {
        // Logique d'affichage du résultat
    }
}

// Utilisation
const client = new AuctionClient('http://localhost:3000', 'votre_jwt_token');
client.joinAuction('uuid-de-l-enchere');
```

## API REST Complémentaire

### Statistiques WebSocket
```
GET /socket/stats
```

Retourne les statistiques en temps réel :
```json
{
    "connectedUsers": 15,
    "activeAuctionRooms": 3,
    "serverUptime": 3600,
    "timestamp": "2024-01-15T10:30:00Z",
    "auctions": {
        "totalAuctions": 50,
        "activeAuctions": 8,
        "totalBids": 234,
        "monitoredAuctions": 8
    }
}
```

## Sécurité

1. **Authentification JWT** : Tous les événements d'enchères nécessitent une authentification
2. **Validation des données** : Toutes les entrées sont validées côté serveur
3. **CORS configuré** : Seules les origines autorisées peuvent se connecter
4. **Rate limiting** : Protection contre le spam d'enchères

## Gestion des Erreurs

Le système gère automatiquement :
- Déconnexions inattendues
- Enchères sur des produits inexistants
- Enchères après la fin de l'enchère
- Montants d'enchères invalides
- Utilisateurs non authentifiés

## Performance

- **Salles d'enchères** : Les utilisateurs ne reçoivent que les mises à jour des enchères qu'ils suivent
- **Nettoyage automatique** : Les salles vides sont automatiquement supprimées
- **Monitoring des enchères** : Gestion automatique de la fin des enchères
