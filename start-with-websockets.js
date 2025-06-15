#!/usr/bin/env node

/**
 * Script de démarrage pour DropTheStreet API avec WebSockets
 * Ce script démarre le serveur avec toutes les fonctionnalités WebSocket activées
 */

const WebServer = require('./src/core/web-server');
const path = require('path');

// Configuration des variables d'environnement si pas déjà définies
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

if (!process.env.PORT) {
    process.env.PORT = 3000;
}

console.log('🚀 Démarrage de DropTheStreet API avec WebSockets...');
console.log('📋 Configuration:');
console.log(`   - Environnement: ${process.env.NODE_ENV}`);
console.log(`   - Port: ${process.env.PORT}`);
console.log(`   - Base de données: ${process.env.DB_NAME || 'Non configurée'}`);
console.log('');

// Créer et démarrer le serveur
const webServer = new WebServer();

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur demandé...');
    webServer.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur (SIGTERM)...');
    webServer.stop();
    process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non capturée:', error);
    webServer.stop();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    console.error('   Promise:', promise);
});

// Démarrer le serveur
try {
    webServer.start();
    
    console.log('');
    console.log('✅ Serveur démarré avec succès !');
    console.log('');
    console.log('📡 Endpoints disponibles:');
    console.log(`   - API REST: http://localhost:${process.env.PORT}`);
    console.log(`   - WebSocket: ws://localhost:${process.env.PORT}`);
    console.log(`   - Statistiques: http://localhost:${process.env.PORT}/socket/stats`);
    console.log('');
    console.log('🔧 Fichiers utiles:');
    console.log(`   - Client de test: ${path.join(__dirname, 'test-websocket-client.html')}`);
    console.log(`   - Documentation: ${path.join(__dirname, 'WEBSOCKET_DOCUMENTATION.md')}`);
    console.log('');
    console.log('💡 Pour tester les WebSockets:');
    console.log('   1. Ouvrez test-websocket-client.html dans votre navigateur');
    console.log('   2. Connectez-vous au serveur');
    console.log('   3. Authentifiez-vous avec un token JWT valide');
    console.log('   4. Testez les fonctionnalités d\'enchères en temps réel');
    console.log('');
    console.log('🔍 Monitoring:');
    console.log('   - Utilisez Ctrl+C pour arrêter le serveur proprement');
    console.log('   - Les logs des WebSockets apparaîtront ici');
    console.log('');
    
} catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
}
