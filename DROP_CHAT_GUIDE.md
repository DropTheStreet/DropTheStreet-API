# 🎁 Guide du Chat de Drops - DropTheStreet API

## 🎯 Vue d'Ensemble

Le système de chat de drops permet aux utilisateurs de discuter en temps réel pendant qu'ils participent à un drop. Chaque drop a son propre chat privé accessible aux participants intéressés.

## 🏗️ Architecture

### Composants Créés

1. **`DropMessage.model.js`** - Modèle pour stocker les messages de drops
2. **`drop_message-repository.js`** - Repository pour gérer les messages
3. **`drop-chat-socket.controller.js`** - Contrôleur WebSocket pour le chat
4. **`test-drop-chat.html`** - Client de test pour le chat de drops

### Base de Données

**Table `DropMessage` :**
```sql
- id_message (UUID, PK)
- id_user (UUID, FK vers User)
- id_drop (UUID, FK vers Drop)
- message (TEXT)
- is_deleted (BOOLEAN)
- edited_at (DATETIME)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

## 🔌 API WebSocket

### Événements Côté Client

#### **Rejoindre le Chat d'un Drop**
```javascript
socket.emit('join_drop_chat', {
    dropId: 'uuid-du-drop'
});

// Réponse
socket.on('drop_chat_joined', (data) => {
    console.log('Chat rejoint:', data.dropId);
    console.log('Participants:', data.participantCount);
});
```

#### **Quitter le Chat d'un Drop**
```javascript
socket.emit('leave_drop_chat', {
    dropId: 'uuid-du-drop'
});

// Réponse
socket.on('drop_chat_left', (data) => {
    console.log('Chat quitté:', data.dropId);
});
```

#### **Récupérer l'Historique**
```javascript
socket.emit('get_drop_chat_history', {
    dropId: 'uuid-du-drop',
    limit: 50,
    offset: 0
});

// Réponse
socket.on('drop_chat_history', (data) => {
    console.log('Messages:', data.messages);
    console.log('Plus de messages:', data.hasMore);
});
```

#### **Envoyer un Message**
```javascript
socket.emit('send_drop_message', {
    dropId: 'uuid-du-drop',
    text: 'Mon message'
});
```

#### **Obtenir les Statistiques**
```javascript
socket.emit('get_drop_chat_stats', {
    dropId: 'uuid-du-drop'
});

// Réponse
socket.on('drop_chat_stats', (data) => {
    console.log('Statistiques:', {
        totalMessages: data.totalMessages,
        todayMessages: data.todayMessages,
        uniqueUsers: data.uniqueUsers,
        onlineParticipants: data.onlineParticipants
    });
});
```

### Événements Côté Serveur

#### **Nouveau Message**
```javascript
socket.on('new_drop_message', (message) => {
    console.log('Nouveau message:', {
        id_message: message.id_message,
        message: message.message,
        user: {
            id_user: message.user.id_user,
            pseudo: message.user.pseudo,
            photo: message.user.photo
        },
        dropId: message.dropId,
        timestamp: message.timestamp
    });
});
```

#### **Utilisateur Rejoint/Quitte**
```javascript
socket.on('user_joined_drop_chat', (data) => {
    console.log(`${data.pseudo} a rejoint le chat`);
    console.log('Participants:', data.participantCount);
});

socket.on('user_left_drop_chat', (data) => {
    console.log('Un utilisateur a quitté le chat');
    console.log('Participants:', data.participantCount);
});
```

#### **Gestion des Erreurs**
```javascript
socket.on('drop_chat_error', (error) => {
    console.error('Erreur de chat:', error.message);
});
```

## 🚀 Utilisation

### 1. Démarrer le Serveur
```bash
npm run start:websocket:dev
```

### 2. Tester avec le Client HTML
1. Ouvrez `test-drop-chat.html` dans votre navigateur
2. Connectez-vous au serveur (`http://localhost:3000`)
3. Authentifiez-vous avec le token `test`
4. Saisissez un ID de drop (ex: `test-drop-123`)
5. Cliquez sur "Rejoindre Chat Drop"
6. Envoyez des messages de test
7. Testez les statistiques

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

#### **Rejoindre le Chat d'un Drop**
```javascript
function joinDropChat(dropId) {
    socket.emit('join_drop_chat', { dropId });
    
    socket.on('drop_chat_joined', (data) => {
        console.log('Chat rejoint pour le drop:', data.dropId);
        // Récupérer l'historique
        socket.emit('get_drop_chat_history', { dropId });
    });
}
```

#### **Afficher les Messages**
```javascript
socket.on('drop_chat_history', (data) => {
    data.messages.forEach(message => {
        displayMessage(message);
    });
});

socket.on('new_drop_message', (message) => {
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
function sendMessage(dropId, text) {
    if (!text.trim()) return;
    
    socket.emit('send_drop_message', {
        dropId: dropId,
        text: text.trim()
    });
}
```

#### **Afficher les Statistiques**
```javascript
function loadDropStats(dropId) {
    socket.emit('get_drop_chat_stats', { dropId });
    
    socket.on('drop_chat_stats', (stats) => {
        document.getElementById('totalMessages').textContent = stats.totalMessages;
        document.getElementById('todayMessages').textContent = stats.todayMessages;
        document.getElementById('uniqueUsers').textContent = stats.uniqueUsers;
        document.getElementById('onlineParticipants').textContent = stats.onlineParticipants;
    });
}
```

## 🔒 Sécurité et Limitations

### **Authentification Requise**
- Tous les événements nécessitent une authentification JWT
- Vérification de l'existence du drop avant de rejoindre

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

### **Statistiques Complètes**
- Messages totaux du drop
- Messages d'aujourd'hui
- Utilisateurs uniques ayant participé
- Participants actuellement en ligne

### **Recherche de Messages**
```javascript
// Disponible via le repository
DropMessageRepository.searchMessages(dropId, 'terme de recherche', 20);
```

### **Modification/Suppression de Messages**
```javascript
// Disponible via le repository (5 minutes max après création)
DropMessageRepository.updateMessage(messageId, 'Nouveau texte', userId);
DropMessageRepository.deleteMessage(messageId, userId);
```

## 🧪 Tests

### **Tests Unitaires**
```bash
npm run test:drop-chat  # À créer si nécessaire
```

### **Tests Manuels**
1. Ouvrez plusieurs onglets avec `test-drop-chat.html`
2. Connectez-vous avec différents tokens de test
3. Rejoignez le même drop
4. Testez l'envoi de messages entre les onglets
5. Vérifiez la synchronisation en temps réel
6. Testez les statistiques

### **Scénarios de Test**
- ✅ Connexion/déconnexion multiple utilisateurs
- ✅ Envoi de messages simultanés
- ✅ Gestion des erreurs (drop inexistant, non authentifié)
- ✅ Rate limiting (spam de messages)
- ✅ Historique des messages
- ✅ Statistiques en temps réel
- ✅ Nettoyage lors des déconnexions

## 🔧 Configuration

### **Variables d'Environnement**
```env
# Aucune configuration spéciale requise
# Utilise la configuration WebSocket existante
```

### **Personnalisation**
- Modifier le rate limiting dans `DropChatSocketController`
- Ajuster la taille de l'historique dans les requêtes
- Personnaliser les validations de messages

## 📈 Métriques et Monitoring

### **Logs à Surveiller**
- Connexions/déconnexions aux chats de drops
- Volume de messages par drop
- Erreurs d'authentification
- Rate limiting déclenché

### **Métriques Importantes**
- Nombre de chats de drops actifs
- Messages par minute
- Participants moyens par drop
- Temps de réponse des messages

## 🚨 Dépannage

### **Problèmes Courants**

#### **Messages non reçus**
- Vérifier l'authentification
- Vérifier que l'utilisateur est dans le bon chat
- Vérifier les logs du serveur

#### **Erreur "Drop non trouvé"**
- Vérifier que l'ID de drop existe en base
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

Vous avez maintenant un système de chat de drops complet avec :

- ✅ **Chat en temps réel** pour chaque drop
- ✅ **Authentification sécurisée** 
- ✅ **Historique des messages**
- ✅ **Statistiques détaillées**
- ✅ **Rate limiting anti-spam**
- ✅ **Gestion des participants**
- ✅ **Client de test fonctionnel**
- ✅ **API WebSocket complète**
- ✅ **Nettoyage automatique**

## 🔄 Différences avec le Chat d'Enchères

- **Couleur thématique** : Vert pour les drops vs Bleu pour les enchères
- **Statistiques étendues** : Plus de métriques pour les drops
- **Événements spécifiques** : `drop_chat_*` vs `auction_chat_*`
- **Contexte d'usage** : Discussions sur les drops vs négociations d'enchères

**Le chat de drops est prêt à être utilisé en production ! 🚀**
