# 💬 Guide du Chat d'Enchères - DropTheStreet API

## 🎯 Vue d'Ensemble

Le système de chat d'enchères permet aux utilisateurs de discuter en temps réel pendant qu'ils participent à une enchère. Chaque enchère a son propre chat privé accessible uniquement aux participants.

## 🏗️ Architecture

### Composants Créés

1. **`AuctionMessage.model.js`** - Modèle pour stocker les messages d'enchères
2. **`auction_message-repository.js`** - Repository pour gérer les messages
3. **`auction-chat-socket.controller.js`** - Contrôleur WebSocket pour le chat
4. **`test-auction-chat.html`** - Client de test pour le chat d'enchères

### Base de Données

**Table `AuctionMessage` :**
```sql
- id_message (UUID, PK)
- id_user (UUID, FK vers User)
- id_auction (UUID, FK vers Auction)
- message (TEXT)
- is_deleted (BOOLEAN)
- edited_at (DATETIME)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

## 🔌 API WebSocket

### Événements Côté Client

#### **Rejoindre le Chat d'une Enchère**
```javascript
socket.emit('join_auction_chat', {
    auctionId: 'uuid-de-l-enchere'
});

// Réponse
socket.on('auction_chat_joined', (data) => {
    console.log('Chat rejoint:', data.auctionId);
    console.log('Participants:', data.participantCount);
});
```

#### **Quitter le Chat d'une Enchère**
```javascript
socket.emit('leave_auction_chat', {
    auctionId: 'uuid-de-l-enchere'
});

// Réponse
socket.on('auction_chat_left', (data) => {
    console.log('Chat quitté:', data.auctionId);
});
```

#### **Récupérer l'Historique**
```javascript
socket.emit('get_auction_chat_history', {
    auctionId: 'uuid-de-l-enchere',
    limit: 50,
    offset: 0
});

// Réponse
socket.on('auction_chat_history', (data) => {
    console.log('Messages:', data.messages);
    console.log('Plus de messages:', data.hasMore);
});
```

#### **Envoyer un Message**
```javascript
socket.emit('send_auction_message', {
    auctionId: 'uuid-de-l-enchere',
    text: 'Mon message'
});
```

### Événements Côté Serveur

#### **Nouveau Message**
```javascript
socket.on('new_auction_message', (message) => {
    console.log('Nouveau message:', {
        id_message: message.id_message,
        message: message.message,
        user: {
            id_user: message.user.id_user,
            pseudo: message.user.pseudo,
            photo: message.user.photo
        },
        auctionId: message.auctionId,
        timestamp: message.timestamp
    });
});
```

#### **Utilisateur Rejoint/Quitte**
```javascript
socket.on('user_joined_auction_chat', (data) => {
    console.log(`${data.pseudo} a rejoint le chat`);
    console.log('Participants:', data.participantCount);
});

socket.on('user_left_auction_chat', (data) => {
    console.log('Un utilisateur a quitté le chat');
    console.log('Participants:', data.participantCount);
});
```

#### **Gestion des Erreurs**
```javascript
socket.on('auction_chat_error', (error) => {
    console.error('Erreur de chat:', error.message);
});
```

## 🚀 Utilisation

### 1. Démarrer le Serveur
```bash
npm run start:websocket:dev
```

### 2. Tester avec le Client HTML
1. Ouvrez `test-auction-chat.html` dans votre navigateur
2. Connectez-vous au serveur (`http://localhost:3000`)
3. Authentifiez-vous avec le token `test`
4. Saisissez un ID d'enchère (ex: `test-auction-123`)
5. Cliquez sur "Rejoindre Chat Enchère"
6. Envoyez des messages de test

### 3. Intégration Frontend

#### **Connexion et Authentification**
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    // S'authentifier
    socket.emit('authenticate', { token: userToken });
});

socket.on('authenticated', (data) => {
    console.log('Authentifié:', data.user);
});
```

#### **Rejoindre le Chat d'une Enchère**
```javascript
function joinAuctionChat(auctionId) {
    socket.emit('join_auction_chat', { auctionId });
    
    socket.on('auction_chat_joined', (data) => {
        console.log('Chat rejoint pour l\'enchère:', data.auctionId);
        // Récupérer l'historique
        socket.emit('get_auction_chat_history', { auctionId });
    });
}
```

#### **Afficher les Messages**
```javascript
socket.on('auction_chat_history', (data) => {
    data.messages.forEach(message => {
        displayMessage(message);
    });
});

socket.on('new_auction_message', (message) => {
    displayMessage(message);
});

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
        <strong>${message.user.pseudo}:</strong>
        ${message.message}
        <small>${new Date(message.timestamp).toLocaleTimeString()}</small>
    `;
    chatContainer.appendChild(messageElement);
}
```

#### **Envoyer un Message**
```javascript
function sendMessage(auctionId, text) {
    if (!text.trim()) return;
    
    socket.emit('send_auction_message', {
        auctionId: auctionId,
        text: text.trim()
    });
}
```

## 🔒 Sécurité et Limitations

### **Authentification Requise**
- Tous les événements nécessitent une authentification JWT
- Vérification de l'existence de l'enchère avant de rejoindre

### **Rate Limiting**
- Maximum 10 messages par minute par utilisateur
- Protection contre le spam

### **Validation des Messages**
- Messages entre 1 et 1000 caractères
- Pas de messages vides ou contenant seulement des espaces

### **Nettoyage Automatique**
- Déconnexion automatique des chats lors de la fermeture de la connexion
- Nettoyage des participants inactifs

## 📊 Fonctionnalités Avancées

### **Recherche de Messages**
```javascript
// À implémenter si nécessaire
socket.emit('search_auction_messages', {
    auctionId: 'uuid',
    query: 'terme de recherche',
    limit: 20
});
```

### **Modification/Suppression de Messages**
```javascript
// À implémenter si nécessaire
socket.emit('edit_auction_message', {
    messageId: 'uuid',
    newText: 'Nouveau texte'
});

socket.emit('delete_auction_message', {
    messageId: 'uuid'
});
```

### **Statistiques du Chat**
```javascript
// À implémenter si nécessaire
socket.emit('get_auction_chat_stats', {
    auctionId: 'uuid'
});
```

## 🧪 Tests

### **Tests Unitaires**
```bash
npm run test:auction-chat  # À créer
```

### **Tests Manuels**
1. Ouvrez plusieurs onglets avec `test-auction-chat.html`
2. Connectez-vous avec différents tokens de test
3. Rejoignez la même enchère
4. Testez l'envoi de messages entre les onglets
5. Vérifiez la synchronisation en temps réel

### **Scénarios de Test**
- ✅ Connexion/déconnexion multiple utilisateurs
- ✅ Envoi de messages simultanés
- ✅ Gestion des erreurs (enchère inexistante, non authentifié)
- ✅ Rate limiting (spam de messages)
- ✅ Historique des messages
- ✅ Nettoyage lors des déconnexions

## 🔧 Configuration

### **Variables d'Environnement**
```env
# Aucune configuration spéciale requise
# Utilise la configuration WebSocket existante
```

### **Personnalisation**
- Modifier le rate limiting dans `AuctionChatSocketController`
- Ajuster la taille de l'historique dans les requêtes
- Personnaliser les validations de messages

## 📈 Métriques et Monitoring

### **Logs à Surveiller**
- Connexions/déconnexions aux chats d'enchères
- Volume de messages par enchère
- Erreurs d'authentification
- Rate limiting déclenché

### **Métriques Importantes**
- Nombre de chats d'enchères actifs
- Messages par minute
- Participants moyens par enchère
- Temps de réponse des messages

## 🚨 Dépannage

### **Problèmes Courants**

#### **Messages non reçus**
- Vérifier l'authentification
- Vérifier que l'utilisateur est dans le bon chat
- Vérifier les logs du serveur

#### **Erreur "Enchère non trouvée"**
- Vérifier que l'ID d'enchère existe en base
- Vérifier le format UUID

#### **Rate limiting**
- Attendre 1 minute avant de renvoyer des messages
- Vérifier les logs pour confirmer le rate limiting

### **Commandes de Diagnostic**
```bash
# Vérifier les connexions WebSocket
curl http://localhost:3000/socket/stats

# Logs du serveur
tail -f logs/websocket.log  # Si configuré
```

## 🎉 Résultat Final

Vous avez maintenant un système de chat d'enchères complet avec :

- ✅ **Chat en temps réel** pour chaque enchère
- ✅ **Authentification sécurisée** 
- ✅ **Historique des messages**
- ✅ **Rate limiting anti-spam**
- ✅ **Gestion des participants**
- ✅ **Client de test fonctionnel**
- ✅ **API WebSocket complète**
- ✅ **Nettoyage automatique**

**Le chat d'enchères est prêt à être utilisé en production ! 🚀**
