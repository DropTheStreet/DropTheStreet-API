# 🐛 Guide de Débogage - Chat WebSocket

## 🚨 Problème Identifié

Vous avez ajouté un log de débogage qui affiche `[object Object]` au lieu des valeurs réelles. Cela indique que vous essayez de concaténer des objets JavaScript avec des chaînes.

## 🔧 Solution Appliquée

J'ai corrigé votre log de débogage dans `src/core/socket-handler.js` :

### ❌ Avant (problématique)
```javascript
console.log("$$$$$$$$$$$$$$$$$$$$$$$" + socket + messageData)
```

### ✅ Après (corrigé)
```javascript
console.log('💬 [DEBUG] Réception message:', {
    socketId: socket.id,
    userId: socket.userId,
    userEmail: socket.userEmail,
    messageData: messageData,
    authenticated: socket.authenticated
});
```

## 🧪 Tests à Effectuer

### 1. Test avec le Serveur Simplifié
```bash
# Dans votre terminal
node test-chat-only.js
```

Ce serveur de test :
- ✅ Ne dépend pas de la base de données
- ✅ Stocke les messages en mémoire
- ✅ Simule l'authentification
- ✅ Inclut tous les logs de débogage

### 2. Test avec le Client HTML
1. Ouvrez `test-websocket-client.html` dans votre navigateur
2. Connectez-vous à `http://localhost:3000`
3. Utilisez n'importe quel token (ex: "test123")
4. Cliquez sur "Rejoindre le Chat"
5. Envoyez un message de test

### 3. Vérification des Logs
Vous devriez voir dans la console du serveur :
```
✅ Nouvelle connexion WebSocket: [socket-id]
🔐 Tentative d'authentification pour: [socket-id]
✅ Utilisateur authentifié: test-[socket-id]@example.com
💬 [socket-id] rejoint le chat général
✅ TestUser-[id] a rejoint le chat (1 participants)
💬 [DEBUG] Message reçu de [socket-id]: { ... }
✅ Message envoyé par TestUser-[id]: "votre message..."
```

## 🔍 Points de Débogage

### 1. Vérifier l'Authentification
```javascript
// Dans la console du navigateur (F12)
socket.emit('authenticate', { token: 'test123' });
```

### 2. Vérifier la Connexion au Chat
```javascript
socket.emit('join_general_chat');
```

### 3. Vérifier l'Envoi de Message
```javascript
socket.emit('send_general_message', { text: 'Test message' });
```

### 4. Vérifier les Événements Reçus
```javascript
socket.on('new_general_message', (data) => {
    console.log('Message reçu:', data);
});
```

## 🚨 Erreurs Communes et Solutions

### Erreur: "Utilisateur non authentifié"
**Cause :** Le socket n'est pas authentifié
**Solution :** Appelez `authenticate` avant d'utiliser le chat

### Erreur: "Le message ne peut pas être vide"
**Cause :** Le champ `text` est vide ou manquant
**Solution :** Vérifiez que `messageData.text` contient du texte

### Erreur: "[object Object]" dans les logs
**Cause :** Concaténation d'objets avec des chaînes
**Solution :** Utilisez `JSON.stringify()` ou `console.log()` avec des objets séparés

## 📊 Vérification des Statistiques

### Via REST API
```bash
curl http://localhost:3000/chat/stats
```

### Via WebSocket
```javascript
socket.emit('get_chat_stats');
socket.on('chat_stats', (stats) => {
    console.log('Statistiques:', stats);
});
```

## 🔧 Débogage Avancé

### 1. Logs Détaillés du Serveur
J'ai ajouté des logs détaillés dans :
- `src/core/socket-handler.js` (réception des événements)
- `src/controllers/chat/chat-socket.controller.js` (traitement des messages)

### 2. Vérification de l'État du Socket
```javascript
// Dans le contrôleur
console.log('État du socket:', {
    id: socket.id,
    authenticated: socket.authenticated,
    userId: socket.userId,
    userPseudo: socket.userPseudo,
    rooms: Array.from(socket.rooms)
});
```

### 3. Vérification des Participants
```javascript
// Nombre de participants dans le chat
const participantCount = io.sockets.adapter.rooms.get('general_chat')?.size || 0;
console.log('Participants dans le chat:', participantCount);
```

## 🎯 Étapes de Résolution

1. **Démarrez le serveur de test :**
   ```bash
   node test-chat-only.js
   ```

2. **Ouvrez le client de test :**
   - Fichier : `test-websocket-client.html`
   - URL : `http://localhost:3000`

3. **Suivez la séquence :**
   - Connexion → Authentification → Rejoindre Chat → Envoyer Message

4. **Vérifiez les logs :**
   - Console du serveur (terminal)
   - Console du navigateur (F12)

5. **Si ça marche avec le test, passez au serveur complet :**
   ```bash
   node start-with-websockets.js
   ```

## 📞 Support

Si vous continuez à avoir des problèmes :

1. **Copiez les logs exacts** du serveur et du navigateur
2. **Indiquez les étapes** que vous avez suivies
3. **Précisez l'erreur** exacte que vous obtenez

Le serveur de test `test-chat-only.js` devrait fonctionner sans problème car il n'utilise pas la base de données et simule tout en mémoire.

---

**Note :** Le problème `[object Object]` est maintenant résolu. Les nouveaux logs vous donneront des informations détaillées et lisibles pour déboguer efficacement.
