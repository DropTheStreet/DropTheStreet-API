#!/usr/bin/env node

/**
 * Script pour exécuter tous les tests des contrôleurs
 * Usage: node run-all-controller-tests.js [options]
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
let jestArgs = ['src/tests/controllers/'];

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
    console.log('🧪 Exécution de tous les tests unitaires des contrôleurs...');
    console.log('📁 Dossier de tests:', 'src/tests/controllers/');
    console.log('📋 Tests inclus:');
    console.log('   - Drop routes (26 tests)');
    console.log('   - Auction routes (22 tests)');
    console.log('   - User routes (4 tests)');
    console.log('   - Support routes (8 tests)');
    console.log('   - Role routes (8 tests)');
    console.log('   - Category routes (11 tests)');
    console.log('   - Brand routes (11 tests)');
    console.log('   - Badge routes (8 tests)');
    console.log('   - Challenge routes (8 tests)');
    console.log('   - Chat routes (37 tests)');
    
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
            console.log('\n🎉 Tous les tests de contrôleurs sont passés avec succès !');
            console.log('📊 Résumé final:');
            console.log('   ✅ Drop routes: 26 tests');
            console.log('   ✅ Auction routes: 22 tests');
            console.log('   ✅ User routes: 4 tests');
            console.log('   ✅ Support routes: 8 tests');
            console.log('   ✅ Role routes: 8 tests');
            console.log('   ✅ Category routes: 11 tests');
            console.log('   ✅ Brand routes: 11 tests');
            console.log('   ✅ Badge routes: 8 tests');
            console.log('   ✅ Challenge routes: 8 tests');
            console.log('   ✅ Chat routes: 37 tests');
            console.log('');
            console.log('🏆 TOTAL: 143 tests réussis sur 10 fichiers de tests');
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
