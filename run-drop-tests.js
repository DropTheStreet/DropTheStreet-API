#!/usr/bin/env node

/**
 * Script pour exécuter les tests des routes Drop
 * Usage: node run-drop-tests.js [options]
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration des options
const args = process.argv.slice(2);
const options = {
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    verbose: args.includes('--verbose'),
    silent: args.includes('--silent')
};

// Commande Jest de base
let jestArgs = ['src/tests/controllers/drop.routes.test.js'];

// Ajouter les options
if (options.coverage) {
    jestArgs.unshift('--coverage');
}

if (options.watch) {
    jestArgs.unshift('--watch');
}

if (options.verbose) {
    jestArgs.unshift('--verbose');
}

if (options.silent) {
    jestArgs.unshift('--silent');
}

// Afficher les informations de démarrage
if (!options.silent) {
    console.log('🧪 Exécution des tests unitaires des routes Drop...');
    console.log('📁 Fichier de test:', 'src/tests/controllers/drop.routes.test.js');
    
    if (options.coverage) {
        console.log('📊 Génération du rapport de couverture activée');
    }
    
    if (options.watch) {
        console.log('👀 Mode watch activé');
    }
    
    console.log('');
}

// Exécuter Jest
const jest = spawn('npx', ['jest', ...jestArgs], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
});

jest.on('close', (code) => {
    if (!options.silent) {
        if (code === 0) {
            console.log('\n✅ Tous les tests sont passés avec succès !');
        } else {
            console.log('\n❌ Certains tests ont échoué.');
        }
    }
    process.exit(code);
});

jest.on('error', (error) => {
    console.error('❌ Erreur lors de l\'exécution des tests:', error.message);
    process.exit(1);
});
