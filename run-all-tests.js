#!/usr/bin/env node

/**
 * Script pour exécuter tous les tests du projet DropTheStreet API
 * Ce script lance les tests unitaires, d'intégration et génère les rapports
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Lancement de la suite de tests complète - DropTheStreet API');
console.log('================================================================');

// Configuration
const testConfig = {
    timeout: 30000, // 30 secondes par test
    coverage: true,
    verbose: true
};

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Fonction pour exécuter une commande
function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        logInfo(`Exécution: ${command} ${args.join(' ')}`);
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Commande échouée avec le code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Vérifier que les dépendances de test sont installées
function checkDependencies() {
    logSection('🔍 Vérification des Dépendances');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const devDeps = packageJson.devDependencies || {};
    
    const requiredDeps = ['jest', 'supertest', 'socket.io-client'];
    const missingDeps = requiredDeps.filter(dep => !devDeps[dep]);
    
    if (missingDeps.length > 0) {
        logError(`Dépendances manquantes: ${missingDeps.join(', ')}`);
        logInfo('Installation des dépendances manquantes...');
        return runCommand('npm', ['install', '--save-dev', ...missingDeps]);
    } else {
        logSuccess('Toutes les dépendances de test sont installées');
        return Promise.resolve();
    }
}

// Vérifier que les fichiers de test existent
function checkTestFiles() {
    logSection('📁 Vérification des Fichiers de Test');
    
    const testFiles = [
        'src/tests/websocket.test.js',
        'src/tests/chat.test.js'
    ];
    
    const optionalTestFiles = [
        'src/tests/auction.test.js',
        'src/tests/auth.test.js',
        'src/tests/integration.test.js'
    ];
    
    // Vérifier les fichiers obligatoires
    const missingRequired = testFiles.filter(file => !fs.existsSync(file));
    if (missingRequired.length > 0) {
        logError(`Fichiers de test manquants: ${missingRequired.join(', ')}`);
        return false;
    }
    
    // Vérifier les fichiers optionnels
    const missingOptional = optionalTestFiles.filter(file => !fs.existsSync(file));
    if (missingOptional.length > 0) {
        logWarning(`Fichiers de test optionnels manquants: ${missingOptional.join(', ')}`);
    }
    
    logSuccess(`${testFiles.length} fichiers de test trouvés`);
    return true;
}

// Exécuter les tests unitaires
async function runUnitTests() {
    logSection('🧪 Tests Unitaires');
    
    try {
        await runCommand('npx', ['jest', '--testPathPattern=src/tests/', '--verbose']);
        logSuccess('Tests unitaires réussis');
        return true;
    } catch (error) {
        logError('Échec des tests unitaires');
        return false;
    }
}

// Exécuter les tests avec couverture
async function runCoverageTests() {
    logSection('📊 Tests avec Couverture de Code');
    
    try {
        await runCommand('npx', ['jest', '--coverage', '--testPathPattern=src/tests/']);
        logSuccess('Tests de couverture réussis');
        return true;
    } catch (error) {
        logError('Échec des tests de couverture');
        return false;
    }
}

// Tester les serveurs de test
async function testTestServers() {
    logSection('🖥️  Test des Serveurs de Test');
    
    const testServers = [
        'test-simple-websocket.js',
        'test-chat-only.js'
    ];
    
    for (const server of testServers) {
        if (fs.existsSync(server)) {
            logInfo(`Test de syntaxe: ${server}`);
            try {
                await runCommand('node', ['-c', server]);
                logSuccess(`${server} - Syntaxe OK`);
            } catch (error) {
                logError(`${server} - Erreur de syntaxe`);
                return false;
            }
        } else {
            logWarning(`${server} - Fichier non trouvé`);
        }
    }
    
    return true;
}

// Vérifier le client de test HTML
function checkTestClient() {
    logSection('🌐 Vérification du Client de Test');
    
    const clientFile = 'test-websocket-client.html';
    if (fs.existsSync(clientFile)) {
        logSuccess('Client de test HTML trouvé');
        logInfo(`Ouvrez ${clientFile} dans votre navigateur pour les tests manuels`);
        return true;
    } else {
        logWarning('Client de test HTML non trouvé');
        return false;
    }
}

// Générer un rapport de test
function generateTestReport() {
    logSection('📋 Génération du Rapport de Test');
    
    const reportData = {
        timestamp: new Date().toISOString(),
        environment: {
            node: process.version,
            platform: process.platform,
            arch: process.arch
        },
        tests: {
            unit: 'Exécutés',
            coverage: 'Généré',
            manual: 'Disponible'
        },
        files: {
            testFiles: fs.existsSync('src/tests/') ? fs.readdirSync('src/tests/').length : 0,
            testServers: ['test-simple-websocket.js', 'test-chat-only.js'].filter(f => fs.existsSync(f)).length,
            documentation: ['PROJECT_DOCUMENTATION.md', 'UNIT_TESTS_DOCUMENTATION.md', 'TESTING_GUIDE.md'].filter(f => fs.existsSync(f)).length
        }
    };
    
    const reportPath = 'test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    logSuccess(`Rapport généré: ${reportPath}`);
    
    return reportData;
}

// Afficher le résumé final
function showSummary(results) {
    logSection('📈 Résumé Final');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r === true).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total des vérifications: ${totalTests}`);
    logSuccess(`Réussies: ${passedTests}`);
    
    if (failedTests > 0) {
        logError(`Échouées: ${failedTests}`);
    }
    
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    if (successRate === 100) {
        logSuccess(`🎉 Tous les tests sont passés avec succès! (${successRate}%)`);
    } else if (successRate >= 80) {
        logWarning(`⚠️  La plupart des tests sont passés (${successRate}%)`);
    } else {
        logError(`❌ Plusieurs tests ont échoué (${successRate}%)`);
    }
    
    console.log('\n📚 Documentation disponible:');
    console.log('  - PROJECT_DOCUMENTATION.md');
    console.log('  - UNIT_TESTS_DOCUMENTATION.md');
    console.log('  - TESTING_GUIDE.md');
    console.log('  - WEBSOCKET_DOCUMENTATION.md');
    
    console.log('\n🔧 Commandes utiles:');
    console.log('  npm test                    # Tests rapides');
    console.log('  npm run test:coverage       # Tests avec couverture');
    console.log('  npm run test:watch          # Tests en surveillance');
    console.log('  node test-simple-websocket.js  # Serveur de test');
}

// Fonction principale
async function main() {
    const startTime = Date.now();
    const results = {};
    
    try {
        // Vérifications préliminaires
        await checkDependencies();
        results.dependencies = true;
        
        results.testFiles = checkTestFiles();
        results.testServers = await testTestServers();
        results.testClient = checkTestClient();
        
        // Exécution des tests
        if (results.testFiles) {
            results.unitTests = await runUnitTests();
            
            if (testConfig.coverage) {
                results.coverageTests = await runCoverageTests();
            }
        }
        
        // Génération du rapport
        const report = generateTestReport();
        results.report = true;
        
    } catch (error) {
        logError(`Erreur lors de l'exécution des tests: ${error.message}`);
        results.error = false;
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    showSummary(results);
    
    console.log(`\n⏱️  Durée totale: ${duration} secondes`);
    console.log('================================================================');
    
    // Code de sortie
    const hasFailures = Object.values(results).some(r => r === false);
    process.exit(hasFailures ? 1 : 0);
}

// Gestion des signaux
process.on('SIGINT', () => {
    console.log('\n\n🛑 Tests interrompus par l\'utilisateur');
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logError(`Erreur non gérée: ${error.message}`);
    process.exit(1);
});

// Lancement du script
if (require.main === module) {
    main().catch(error => {
        logError(`Erreur fatale: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, runUnitTests, runCoverageTests };
