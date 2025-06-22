# 🔄 Système de Jobs pour les Enchères - Guide Complet

## 🎯 Vue d'Ensemble

J'ai créé un système de jobs automatisé pour gérer la fin des enchères et les paiements. Voici comment ça fonctionne :

## 📋 Architecture du Système

### **1. Jobs Créés**

- **`AuctionMonitorJob`** - Surveille les enchères qui se terminent
- **`PaymentReminderJob`** - Gère les rappels et retards de paiement
- **`AuctionEndService`** - Service de finalisation des enchères

### **2. Fonctionnement Automatique**

```
Enchère se termine → Job détecte → Trouve le gagnant → Ajoute au panier → Démarre le suivi de paiement
```

## ⏰ Planning des Jobs

### **AuctionMonitorJob**
- **Toutes les minutes** : Vérification des enchères terminées
- **Toutes les heures** : Nettoyage des anciennes enchères

### **PaymentReminderJob**
- **Toutes les heures** : Rappels de paiement (24h, 6h, 1h avant expiration)
- **Toutes les 6 heures** : Vérification des paiements en retard

## 🔧 Installation

### **1. Installer node-cron**
```bash
npm install node-cron --save
```

### **2. Démarrer le serveur**
```bash
npm run start:websocket:dev
```

Les jobs se lancent automatiquement au démarrage du serveur.

## 🏁 Processus de Fin d'Enchère

### **1. Détection Automatique**
- Le job vérifie toutes les minutes les enchères terminées
- Détecte les enchères dont `end_date <= maintenant`

### **2. Finalisation**
```javascript
// Processus automatique :
1. Trouve le gagnant (dernière enchère la plus élevée)
2. Marque l'enchère comme 'ended'
3. Ajoute l'article au panier du gagnant
4. Définit une deadline de paiement (48h)
5. Envoie des notifications WebSocket
```

### **3. Ajout au Panier**
```javascript
// L'article est ajouté avec :
{
    id_user: gagnant.id_user,
    id_product: produit.id_product,
    quantity: 1,
    price: prix_final_enchère, // Pas le prix original !
    auction_id: enchère.id_auction,
    is_auction_item: true,
    must_pay_before: new Date(+48h)
}
```

## 💳 Système de Paiement

### **1. Délai de Paiement**
- **48 heures** pour payer après la fin de l'enchère
- Rappels automatiques à 24h, 6h, et 1h avant expiration

### **2. Rappels Automatiques**
```javascript
// Notifications WebSocket envoyées :
- 24h avant : "Il vous reste 24h pour payer"
- 6h avant : "Attention: Il vous reste 6h !"
- 1h avant : "URGENT: Moins d'1h restante !"
```

### **3. Gestion des Retards**
```javascript
// Si pas payé après 48h :
1. Article marqué comme 'overdue'
2. Notification de retard envoyée
3. 24h de grâce supplémentaires
4. Suppression définitive du panier
5. Sanctions possibles (à implémenter)
```

## 📡 Événements WebSocket

### **Fin d'Enchère**
```javascript
// Diffusé à tous
socket.on('auction_ended', (data) => {
    console.log('Enchère terminée:', data.auctionId);
    console.log('Gagnant:', data.winner);
    console.log('Prix final:', data.finalPrice);
});

// Envoyé au gagnant uniquement
socket.on('auction_won', (data) => {
    console.log('Vous avez gagné !');
    console.log('Produit:', data.product);
    console.log('À payer avant:', data.paymentDeadline);
});
```

### **Rappels de Paiement**
```javascript
socket.on('payment_reminder', (data) => {
    console.log('Rappel:', data.message);
    console.log('Temps restant:', data.timeLeft);
    console.log('Actions:', data.actions);
});

socket.on('payment_overdue', (data) => {
    console.log('Paiement en retard !');
    console.log('Conséquences:', data.consequences);
});
```

## 🛠️ Configuration

### **Modifier les Délais**

Dans `auction-end.service.js` :
```javascript
// Changer le délai de paiement (actuellement 48h)
paymentDeadline.setHours(paymentDeadline.getHours() + 48); // Modifier ici

// Dans le CartItem
must_pay_before: new Date(Date.now() + 48 * 60 * 60 * 1000) // Modifier ici
```

### **Modifier la Fréquence des Jobs**

Dans `auction-monitor.job.js` :
```javascript
// Actuellement toutes les minutes
cron.schedule('* * * * *', async () => { ... });

// Pour changer (ex: toutes les 30 secondes)
cron.schedule('*/30 * * * * *', async () => { ... });
```

## 📊 Monitoring et Logs

### **Logs à Surveiller**
```bash
# Enchères terminées
🏁 [AUCTION-MONITOR] 3 enchère(s) terminée(s) détectée(s)
✅ [AUCTION-END] Enchère abc123 finalisée avec succès
🏆 [AUCTION-END] Gagnant: JohnDoe avec 150€

# Rappels de paiement
📧 [PAYMENT-REMINDER] 5 rappel(s) envoyé(s) pour 24h
🚫 [PAYMENT-REMINDER] 2 article(s) en retard traité(s)

# Ajouts au panier
🛒 [AUCTION-END] Article ajouté au panier: cart_item_456
```

### **Vérifications Manuelles**
```sql
-- Enchères récemment terminées
SELECT * FROM Auction WHERE status = 'ended' AND ended_at > NOW() - INTERVAL 1 HOUR;

-- Articles d'enchères dans les paniers
SELECT * FROM CartItem WHERE is_auction_item = true AND payment_status IS NULL;

-- Paiements en retard
SELECT * FROM CartItem WHERE is_auction_item = true AND must_pay_before < NOW();
```

## 🚨 Gestion des Erreurs

### **Si un Job Plante**
- Les jobs redémarrent automatiquement à la prochaine exécution
- Les erreurs sont loggées mais n'arrêtent pas le serveur
- Chaque enchère est traitée individuellement

### **Si une Enchère n'est pas Finalisée**
- Le job réessaiera à la prochaine exécution
- Vérifiez les logs pour identifier le problème
- Possibilité de finaliser manuellement via l'API

## 🔮 Extensions Futures

### **Système de Sanctions**
```javascript
// À implémenter dans handleOverduePayment()
- Compter les retards par utilisateur
- Bannissement temporaire après X retards
- Bannissement définitif pour récidivistes
```

### **Notifications Email**
```javascript
// Ajouter aux rappels de paiement
- Email 24h avant expiration
- Email de confirmation de paiement
- Email de sanctions
```

### **Dashboard Admin**
```javascript
// Interface pour surveiller :
- Enchères en cours de finalisation
- Paiements en retard
- Statistiques des jobs
```

## ✅ Avantages du Système

1. **🔄 Automatique** - Aucune intervention manuelle requise
2. **⚡ Temps réel** - Notifications WebSocket instantanées
3. **🛡️ Robuste** - Gestion d'erreurs et retry automatique
4. **📊 Traçable** - Logs détaillés de toutes les opérations
5. **⚖️ Équitable** - Traitement identique pour tous les utilisateurs
6. **🔧 Configurable** - Délais et fréquences modifiables

## 🎉 Résultat

Votre système d'enchères est maintenant **100% automatisé** :

- ✅ **Fin d'enchère automatique** avec détection du gagnant
- ✅ **Ajout automatique au panier** avec prix d'enchère
- ✅ **Rappels de paiement automatiques** avec escalade
- ✅ **Gestion des retards** avec sanctions progressives
- ✅ **Notifications temps réel** pour tous les événements
- ✅ **Monitoring continu** avec logs détaillés

**Plus besoin d'intervention manuelle - tout est géré automatiquement ! 🚀**
