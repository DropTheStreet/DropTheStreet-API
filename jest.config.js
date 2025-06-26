module.exports = {
  // Environnement de test
  testEnvironment: 'node',

  // Répertoires de test
  testMatch: [
    '**/src/tests/**/*.test.js',
    '**/tests/**/*.test.js'
  ],

  // Fichiers à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],

  // Configuration de la couverture
  collectCoverage: false, // Activé seulement avec --coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/**/*.test.js',
    '!node_modules/**',
    '!coverage/**'
  ],

  // Répertoire de sortie de la couverture
  coverageDirectory: 'coverage',

  // Formats de rapport de couverture
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],

  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Seuils spécifiques pour les fichiers critiques
    './src/core/socket-handler.js': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/controllers/chat/chat-socket.controller.js': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Timeout par défaut pour les tests (en millisecondes)
  testTimeout: 10000,

  // Configuration pour les tests WebSocket
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Transformation des modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Extensions de fichiers à traiter
  moduleFileExtensions: ['js', 'json'],

  // Chemins de modules
  moduleDirectories: ['node_modules', 'src'],

  // Verbose par défaut
  verbose: false,

  // Détection des handles ouverts
  detectOpenHandles: true,

  // Forcer la fermeture après les tests
  forceExit: true,

  // Nombre maximum de workers
  maxWorkers: '50%',

  // Cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Notifications (désactivées par défaut)
  notify: false,

  // Couleurs dans la sortie (géré automatiquement par Jest)

  // Affichage des erreurs
  errorOnDeprecated: true,

  // Configuration pour les mocks
  clearMocks: true,
  restoreMocks: true,

  // Patterns pour les fichiers de setup/teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js'
};
