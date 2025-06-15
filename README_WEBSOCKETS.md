# 🔌 WebSockets pour DropTheStreet API

## 🎯 Vue d'ensemble

Cette implémentation ajoute des fonctionnalités WebSocket en temps réel à l'API DropTheStreet, permettant :

- **Enchères en temps réel** : Les utilisateurs peuvent enchérir et voir les mises à jour instantanément
- **Notifications live** : Alertes en temps réel pour les nouvelles enchères, fins d'enchères, etc.
- **Gestion des salles** : Chaque enchère a sa propre salle pour optimiser les performances
- **Authentification sécurisée** : Utilisation des tokens JWT pour l'authentification WebSocket
- **Monitoring automatique** : Gestion automatique de la fin des enchères

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Assurez-vous que votre fichier `.env` contient :
```env
PORT=3000
SECRET_KEY=votre_clé_secrète_jwt
DB_NAME=votre_base_de_données
# ... autres variables d'environnement
```

### 3. Démarrage du serveur avec WebSockets
```bash
# Démarrage normal
npm run start:websocket

# Démarrage en mode développement (avec nodemon)
npm run start:websocket:dev
```

### 4. Test des WebSockets
Ouvrez le fichier `test-websocket-client.html` dans votre navigateur pour tester les fonctionnalités.

## 📁 Structure des Fichiers

```
src/
├── core/
│   ├── socket-handler.js          # Gestionnaire principal des WebSockets
│   └── web-server.js              # Serveur modifié avec support WebSocket
├── controllers/
│   └── auction/
│       └── auction-socket.controller.js  # Contrôleur WebSocket pour enchères
├── services/
│   └── auction.service.js         # Service de gestion des enchères
└── tests/
    └── websocket.test.js          # Tests unitaires WebSocket

# Fichiers de documentation et test
├── test-websocket-client.html     # Client de test HTML
├── WEBSOCKET_DOCUMENTATION.md     # Documentation complète
├── README_WEBSOCKETS.md           # Ce fichier
└── start-with-websockets.js       # Script de démarrage
```

## 🔧 Fonctionnalités Implémentées

### ✅ Authentification
- Authentification JWT via WebSocket
- Gestion des sessions utilisateur
- Sécurisation des événements d'enchères

### ✅ Gestion des Enchères
- Rejoindre/quitter des enchères en temps réel
- Placement d'enchères avec validation
- Notifications instantanées des nouvelles enchères
- Gestion automatique de la fin des enchères

### ✅ Salles d'Enchères
- Isolation des événements par enchère
- Comptage des participants en temps réel
- Nettoyage automatique des salles vides

### ✅ Monitoring et Statistiques
- Endpoint `/socket/stats` pour les statistiques
- Monitoring des enchères actives
- Gestion des timers de fin d'enchères

### ✅ Gestion des Erreurs
- Validation des données côté serveur
- Gestion des déconnexions inattendues
- Messages d'erreur explicites

## 🎮 Utilisation

### Côté Client JavaScript

```javascript
import io from 'socket.io-client';

// Connexion
const socket = io('http://localhost:3000');

// Authentification
socket.emit('authenticate', { token: 'votre_jwt_token' });

// Rejoindre une enchère
socket.emit('join_auction', { auctionId: 'uuid-enchère' });

// Placer une enchère
socket.emit('place_bid', { 
    auctionId: 'uuid-enchère', 
    bidAmount: 150.00 
});

// Écouter les événements
socket.on('new_bid', (data) => {
    console.log('Nouvelle enchère:', data);
});

socket.on('auction_ended', (data) => {
    console.log('Enchère terminée:', data);
});
```

### Événements Disponibles

**Émis par le client :**
- `authenticate` - Authentification
- `join_auction` - Rejoindre une enchère
- `leave_auction` - Quitter une enchère
- `place_bid` - Placer une enchère
- `get_active_auctions` - Obtenir les enchères actives

**Reçus par le client :**
- `authenticated` - Confirmation d'authentification
- `auction_joined` - Enchère rejointe
- `new_bid` - Nouvelle enchère placée
- `auction_ended` - Enchère terminée
- `auction_won` - Enchère remportée
- `active_auctions` - Liste des enchères actives

## 🧪 Tests

### Exécuter les tests WebSocket
```bash
npm run test:websocket
```

### Tests manuels
1. Ouvrez `test-websocket-client.html` dans votre navigateur
2. Connectez-vous au serveur
3. Authentifiez-vous avec un token JWT valide
4. Testez les différentes fonctionnalités

## 📊 Monitoring

### Statistiques en temps réel
```bash
curl http://localhost:3000/socket/stats
```

Retourne :
```json
{
    "connectedUsers": 15,
    "activeAuctionRooms": 3,
    "serverUptime": 3600,
    "auctions": {
        "totalAuctions": 50,
        "activeAuctions": 8,
        "totalBids": 234
    }
}
```

## 🔒 Sécurité

- **Authentification JWT** : Tous les événements d'enchères nécessitent une authentification
- **Validation des données** : Toutes les entrées sont validées côté serveur
- **CORS configuré** : Protection contre les requêtes cross-origin non autorisées
- **Isolation des salles** : Les utilisateurs ne reçoivent que les données des enchères qu'ils suivent

## 🚨 Dépannage

### Problèmes de connexion
1. Vérifiez que le serveur est démarré avec `npm run start:websocket`
2. Vérifiez que le port 3000 est disponible
3. Vérifiez la configuration CORS si vous testez depuis un autre domaine

### Problèmes d'authentification
1. Vérifiez que votre token JWT est valide
2. Vérifiez que la variable `SECRET_KEY` est correctement configurée
3. Vérifiez que l'utilisateur existe dans la base de données

### Problèmes d'enchères
1. Vérifiez que l'enchère existe et est active
2. Vérifiez que vous n'êtes pas le propriétaire de l'enchère
3. Vérifiez que le montant est supérieur au prix actuel

## 📈 Performance

### Optimisations implémentées
- **Salles par enchère** : Évite la diffusion globale des événements
- **Nettoyage automatique** : Suppression des salles vides
- **Validation côté serveur** : Évite les traitements inutiles
- **Gestion des timers** : Fin automatique des enchères

### Recommandations
- Utilisez un load balancer pour la production
- Configurez Redis pour la persistance des sessions en cluster
- Implémentez un rate limiting pour éviter le spam

## 🔄 Évolutions Futures

### Fonctionnalités à ajouter
- [ ] Notifications push
- [ ] Chat en temps réel dans les enchères
- [ ] Enchères automatiques (bots)
- [ ] Historique des connexions
- [ ] Métriques avancées

### Améliorations techniques
- [ ] Support Redis pour le clustering
- [ ] Rate limiting par utilisateur
- [ ] Compression des messages WebSocket
- [ ] Reconnexion automatique côté client

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation complète dans `WEBSOCKET_DOCUMENTATION.md`
2. Vérifiez les logs du serveur
3. Testez avec le client HTML fourni
4. Exécutez les tests unitaires

---

**Développé pour DropTheStreet API** 🛍️
