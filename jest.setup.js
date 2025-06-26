// Configuration Jest pour les tests
require('dotenv').config({ path: '.env.test' });

// Configuration globale pour les tests
global.console = {
    ...console,
    // Supprimer les logs pendant les tests sauf les erreurs
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error
};

// Timeout par défaut pour les tests async
jest.setTimeout(30000);

// Mock des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'test_dropthestreet';
process.env.DB_PORT = process.env.DB_PORT || '3306';

// Configuration pour éviter les warnings de mémoire
process.setMaxListeners(0);
