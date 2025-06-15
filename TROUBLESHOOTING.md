# 🔧 Guide de Dépannage - WebSockets DropTheStreet

## 🚨 Problème Actuel

Il semble y avoir un problème avec l'exécution des commandes Node.js dans l'environnement Windows actuel.

## 🛠️ Solutions de Dépannage

### 1. Vérification de l'Installation Node.js

Ouvrez un terminal Windows (cmd ou PowerShell) et vérifiez :

```cmd
node --version
npm --version
```

Si ces commandes ne fonctionnent pas, Node.js n'est pas installé ou pas dans le PATH.

### 2. Installation/Réinstallation de Node.js

1. Téléchargez Node.js depuis https://nodejs.org/
2. Installez la version LTS recommandée
3. Redémarrez votre terminal
4. Vérifiez l'installation avec `node --version`

### 3. Problèmes de PATH Windows

Si Node.js est installé mais non reconnu :

1. Ouvrez les Variables d'environnement Windows
2. Ajoutez le chemin d'installation de Node.js au PATH
3. Redémarrez le terminal

### 4. Utilisation de Laragon

Puisque vous utilisez Laragon, vous pouvez :

1. Ouvrir le terminal Laragon
2. Naviguer vers votre projet : `cd C:\laragon\www\DropTheStreet-API`
3. Exécuter les commandes Node.js depuis là

## 🚀 Démarrage Manuel

### Étape 1: Installer les dépendances
```cmd
npm install
```

### Étape 2: Tester le serveur simple
```cmd
node test-simple-websocket.js
```

### Étape 3: Tester le serveur complet
```cmd
node start-with-websockets.js
```

## 🧪 Test des WebSockets

### Option 1: Client HTML
1. Ouvrez `test-websocket-client.html` dans votre navigateur
2. Connectez-vous à `http://localhost:3000`
3. Utilisez n'importe quel token pour l'authentification en mode test

### Option 2: Test avec curl
```cmd
curl http://localhost:3000/socket/stats
```

### Option 3: Test avec Postman
- URL: `http://localhost:3000/socket/stats`
- Méthode: GET

## 🔍 Vérification des Fichiers

Tous les fichiers WebSocket ont été créés :

### Fichiers principaux :
- ✅ `src/core/socket-handler.js`
- ✅ `src/controllers/auction/auction-socket.controller.js`
- ✅ `src/services/auction.service.js`
- ✅ `src/core/web-server.js` (modifié)

### Fichiers de test :
- ✅ `test-simple-websocket.js` (serveur de test simplifié)
- ✅ `test-websocket-client.html` (client de test)
- ✅ `src/tests/websocket.test.js` (tests unitaires)

### Documentation :
- ✅ `WEBSOCKET_DOCUMENTATION.md`
- ✅ `README_WEBSOCKETS.md`
- ✅ `TROUBLESHOOTING.md` (ce fichier)

## 🐛 Erreurs Communes

### Erreur: "Module not found"
```cmd
npm install
```

### Erreur: "Port already in use"
```cmd
# Changer le port dans le fichier .env
PORT=3001
```

### Erreur: "Cannot connect to database"
- Vérifiez que votre base de données MySQL/MariaDB est démarrée
- Vérifiez les paramètres de connexion dans `.env`

### Erreur: "JWT secret not defined"
```env
# Ajoutez dans votre fichier .env
SECRET_KEY=votre_clé_secrète_ici
```

## 🔄 Solutions Alternatives

### 1. Utiliser le serveur de test simplifié
Le fichier `test-simple-websocket.js` ne dépend pas de la base de données et peut être utilisé pour tester les WebSockets de base.

### 2. Démarrage par étapes
1. Testez d'abord `test-simple-websocket.js`
2. Une fois que ça fonctionne, passez au serveur complet
3. Ajoutez progressivement les fonctionnalités

### 3. Utiliser un autre terminal
- Git Bash
- PowerShell
- Terminal intégré de VS Code
- Terminal Laragon

## 📞 Support Supplémentaire

### Logs à vérifier :
1. Logs du serveur Node.js
2. Logs de la console du navigateur (F12)
3. Logs de la base de données

### Informations à collecter :
- Version de Node.js : `node --version`
- Version de npm : `npm --version`
- Système d'exploitation
- Messages d'erreur exacts

## 🎯 Test Rapide

Pour vérifier que tout fonctionne, exécutez dans l'ordre :

```cmd
# 1. Vérifier Node.js
node --version

# 2. Installer les dépendances
npm install

# 3. Tester le serveur simple
node test-simple-websocket.js

# 4. Dans un autre terminal, tester l'API
curl http://localhost:3000/socket/stats
```

Si ces étapes fonctionnent, votre environnement WebSocket est prêt !

## 🔧 Configuration Laragon

Si vous utilisez Laragon :

1. Ouvrez Laragon
2. Cliquez sur "Terminal"
3. Naviguez vers votre projet
4. Exécutez les commandes Node.js

Laragon inclut généralement Node.js dans son environnement.

---

**Note :** Si vous continuez à avoir des problèmes, le serveur de test simplifié (`test-simple-websocket.js`) peut être utilisé pour valider que les WebSockets fonctionnent avant d'intégrer avec votre base de données complète.
