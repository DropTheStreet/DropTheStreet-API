// Teardown global pour Jest - exécuté une seule fois après tous les tests
module.exports = async () => {
    console.log('🧹 Nettoyage après les tests Jest...');
    
    // Nettoyage des ressources globales si nécessaire
    
    console.log('✅ Teardown global Jest terminé');
};
