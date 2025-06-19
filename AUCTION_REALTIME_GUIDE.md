# 🔨 Guide des Enchères Temps Réel - DropTheStreet API

## 🎯 Vue d'Ensemble

Le système d'enchères temps réel permet aux utilisateurs de participer à des enchères en direct avec des mises à jour instantanées, une gestion automatique des conflits, et des fonctionnalités avancées comme la prolongation automatique.

## 🏗️ Architecture

### Composants Créés

1. **`AuctionRealtimeService`** - Service principal pour la logique métier des enchères
2. **`AuctionSocketController`** - Contrôleur WebSocket mis à jour
3. **`test-auction-realtime.html`** - Client de test interactif
4. **Intégration complète** dans le système WebSocket existant

### Fonctionnalités Principales

- ✅ **Enchères en temps réel** avec diffusion instantanée
- ✅ **Gestion des conflits** avec queue de traitement
- ✅ **Prolongation automatique** (2 minutes si enchère dans les 2 dernières minutes)
- ✅ **Monitoring automatique** des enchères qui se terminent
- ✅ **Historique complet** des enchères
- ✅ **Validation robuste** des montants et permissions
- ✅ **Notifications temps réel** pour tous les événements

## 🔌 API WebSocket

### Événements Côté Client

#### **Rejoindre une Enchère**
```javascript
socket.emit('join_auction', {
    auctionId: 'uuid-de-l-enchere'
});

// Réponse
socket.on('auction_joined', (data) => {
    console.log('Enchère rejointe:', data.auctionId);
    console.log('Détails:', data.auctionDetails);
});
```

#### **Placer une Enchère**
```javascript
socket.emit('place_bid', {
    auctionId: 'uuid-de-l-enchere',
    bidAmount: 150  // en euros
});

// Confirmation
socket.on('bid_placed', (data) => {
    console.log('Enchère placée:', data.amount);
});
```

#### **Récupérer l'Historique**
```javascript
socket.emit('get_bid_history', {
    auctionId: 'uuid-de-l-enchere',
    limit: 50,
    offset: 0
});

// Réponse
socket.on('bid_history', (data) => {
    console.log('Historique:', data.bids);
    console.log('Plus d\'enchères:', data.hasMore);
});
```

#### **Quitter une Enchère**
```javascript
socket.emit('leave_auction', {
    auctionId: 'uuid-de-l-enchere'
});
```

### Événements Côté Serveur

#### **Nouvelle Enchère**
```javascript
socket.on('new_bid', (bidData) => {
    console.log('Nouvelle enchère:', {
        id_bid: bidData.id_bid,
        amount: bidData.amount,
        user: {
            id_user: bidData.user.id_user,
            pseudo: bidData.user.pseudo,
            photo: bidData.user.photo
        },
        auctionId: bidData.auctionId,
        timestamp: bidData.timestamp
    });
});
```

#### **Enchère Mise à Jour**
```javascript
socket.on('auction_updated', (auctionData) => {
    console.log('Enchère mise à jour:', {
        id_auction: auctionData.id_auction,
        actual_price: auctionData.actual_price,
        timeRemaining: auctionData.timeRemaining,
        participantCount: auctionData.participantCount,
        lastBid: auctionData.lastBid,
        status: auctionData.status,
        isActive: auctionData.isActive
    });
});
```

#### **Enchère Prolongée**
```javascript
socket.on('auction_extended', (data) => {
    console.log('Enchère prolongée:', {
        auctionId: data.auctionId,
        newEndDate: data.newEndDate,
        message: data.message
    });
});
```

#### **Enchère se Termine Bientôt**
```javascript
socket.on('auction_ending_soon', (data) => {
    console.log('Enchère se termine bientôt:', {
        auctionId: data.auctionId,
        timeRemaining: data.timeRemaining,
        message: data.message
    });
});
```

#### **Enchère Terminée**
```javascript
socket.on('auction_ended', (data) => {
    console.log('Enchère terminée:', {
        auctionId: data.auctionId,
        winner: data.winner,
        finalPrice: data.finalPrice,
        message: data.message
    });
});
```

#### **Gestion des Erreurs**
```javascript
socket.on('bid_error', (error) => {
    console.error('Erreur d\'enchère:', error.message);
});

socket.on('auction_error', (error) => {
    console.error('Erreur générale:', error.message);
});
```

## 🚀 Utilisation

### 1. Démarrer le Serveur
```bash
npm run start:websocket:dev
```

### 2. Tester avec le Client HTML
1. Ouvrez `test-auction-realtime.html` dans votre navigateur
2. Connectez-vous au serveur (`http://localhost:3000`)
3. Authentifiez-vous avec le token `test`
4. Saisissez un ID d'enchère (ex: `test-auction-123`)
5. Cliquez sur "Rejoindre Enchère"
6. Placez des enchères de test
7. Testez avec plusieurs onglets pour voir la synchronisation

### 3. Intégration Frontend

#### **Connexion et Authentification**
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    socket.emit('authenticate', { token: userToken });
});

socket.on('authenticated', (data) => {
    console.log('Authentifié:', data.user);
});
```

#### **Rejoindre une Enchère**
```javascript
function joinAuction(auctionId) {
    socket.emit('join_auction', { auctionId });
    
    socket.on('auction_joined', (data) => {
        console.log('Enchère rejointe:', data.auctionDetails);
        updateAuctionDisplay(data.auctionDetails);
        startTimeCountdown(data.auctionDetails.timeRemaining);
    });
}
```

#### **Placer une Enchère**
```javascript
function placeBid(auctionId, amount) {
    socket.emit('place_bid', {
        auctionId: auctionId,
        bidAmount: amount
    });
}

socket.on('bid_placed', (data) => {
    showSuccessMessage(`Enchère placée: ${data.amount}€`);
});

socket.on('bid_error', (error) => {
    showErrorMessage(error.message);
});
```

#### **Écouter les Nouvelles Enchères**
```javascript
socket.on('new_bid', (bidData) => {
    updateCurrentPrice(bidData.amount);
    addBidToHistory(bidData);
    
    if (bidData.user.id_user !== currentUserId) {
        showNotification(`Nouvelle enchère: ${bidData.amount}€ par ${bidData.user.pseudo}`);
    }
});
```

#### **Gestion du Temps Restant**
```javascript
let countdownInterval;

function startTimeCountdown(timeRemaining) {
    clearInterval(countdownInterval);
    
    let remaining = timeRemaining;
    
    const updateCountdown = () => {
        if (remaining <= 0) {
            document.getElementById('timeRemaining').textContent = 'Terminée';
            clearInterval(countdownInterval);
            return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        document.getElementById('timeRemaining').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        remaining -= 1000;
    };
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}
```

## 🔒 Sécurité et Validations

### **Authentification Requise**
- Tous les événements nécessitent une authentification JWT
- Vérification de l'existence de l'enchère
- Vérification que l'utilisateur n'est pas le propriétaire

### **Validations des Enchères**
- Montant supérieur au prix actuel
- Enchère active (entre start_date et end_date)
- Montant minimum de 1€ de plus que le prix actuel

### **Gestion des Conflits**
- Queue de traitement pour éviter les enchères simultanées
- Vérification en temps réel du prix actuel
- Traitement séquentiel des enchères

### **Prolongation Automatique**
- Si enchère dans les 2 dernières minutes → +2 minutes
- Notification automatique de la prolongation
- Mise à jour du temps restant pour tous les participants

## 📊 Fonctionnalités Avancées

### **Monitoring Automatique**
- Vérification toutes les minutes des enchères qui se terminent
- Notifications 5 minutes avant la fin
- Finalisation automatique des enchères terminées

### **Cache et Performance**
- Cache des enchères actives
- Queue de traitement pour éviter les conflits
- Nettoyage automatique des données obsolètes

### **Statistiques Temps Réel**
- Nombre de participants connectés
- Historique complet des enchères
- Temps de réponse optimisé

## 🧪 Tests

### **Tests Manuels**
1. Ouvrez plusieurs onglets avec `test-auction-realtime.html`
2. Connectez-vous avec différents tokens
3. Rejoignez la même enchère
4. Testez les enchères simultanées
5. Vérifiez la synchronisation temps réel
6. Testez la prolongation automatique

### **Scénarios de Test**
- ✅ Enchères simultanées de plusieurs utilisateurs
- ✅ Gestion des conflits (même montant en même temps)
- ✅ Prolongation automatique
- ✅ Fin d'enchère et notification du gagnant
- ✅ Validation des montants invalides
- ✅ Gestion des déconnexions
- ✅ Historique des enchères

## 🔧 Configuration

### **Variables d'Environnement**
```env
# Aucune configuration spéciale requise
# Utilise la configuration WebSocket existante
```

### **Personnalisation**
- Modifier la durée de prolongation (actuellement 2 minutes)
- Ajuster l'intervalle de monitoring (actuellement 1 minute)
- Personnaliser les notifications d'alerte

## 📈 Métriques et Monitoring

### **Logs à Surveiller**
- Enchères placées avec succès
- Conflits d'enchères résolus
- Prolongations automatiques
- Enchères terminées et gagnants

### **Métriques Importantes**
- Nombre d'enchères actives simultanées
- Temps de traitement des enchères
- Taux de prolongations automatiques
- Participants moyens par enchère

## 🚨 Dépannage

### **Problèmes Courants**

#### **Enchères non synchronisées**
- Vérifier la connexion WebSocket
- Vérifier l'authentification
- Vérifier les logs du serveur

#### **Erreur "Enchère dépassée"**
- Normal en cas d'enchères simultanées
- Le système prend la première enchère valide

#### **Temps restant incorrect**
- Rafraîchir la page
- Vérifier l'heure du serveur

### **Commandes de Diagnostic**
```bash
# Vérifier les connexions WebSocket
curl http://localhost:3000/socket/stats

# Logs des enchères
grep "AUCTION-SERVICE" logs/app.log
```

## 🎉 Résultat Final

Vous avez maintenant un système d'enchères temps réel complet avec :

- ✅ **Enchères en temps réel** avec synchronisation instantanée
- ✅ **Gestion robuste des conflits**
- ✅ **Prolongation automatique intelligente**
- ✅ **Monitoring et notifications automatiques**
- ✅ **Historique complet des enchères**
- ✅ **Validation et sécurité renforcées**
- ✅ **Client de test fonctionnel**
- ✅ **API WebSocket complète**
- ✅ **Performance optimisée**

**Le système d'enchères temps réel est prêt pour la production ! 🚀**
