// Setup global pour Jest - exécuté une seule fois avant tous les tests
module.exports = async () => {
    console.log('🚀 Initialisation des tests Jest...');
    
    // Configuration des variables d'environnement pour les tests
    process.env.NODE_ENV = 'test';
    
    // Autres configurations globales si nécessaires
    console.log('✅ Setup global Jest terminé');
};
