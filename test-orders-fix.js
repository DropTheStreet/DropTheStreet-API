/**
 * Test rapide pour vérifier la correction de l'erreur brand
 */

const http = require('http');

async function testOrdersRoute() {
    console.log('🧪 Test de la route /payment/orders après correction...');
    
    const testUserId = '5b766d7e-1afd-4bf0-823b-e4800507b42a'; // Remplacez par un vrai ID
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/payment/orders?id_user=${testUserId}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 Status: ${res.statusCode}`);
                
                try {
                    const response = JSON.parse(data);
                    
                    if (res.statusCode === 200 && response.success) {
                        console.log('✅ Route fonctionne !');
                        console.log(`📦 ${response.data.orders.length} commandes trouvées`);
                        
                        if (response.data.orders.length > 0) {
                            const firstOrder = response.data.orders[0];
                            console.log('🔍 Première commande:');
                            console.log(`   - ID: ${firstOrder.id_payment}`);
                            console.log(`   - Montant: ${firstOrder.amount_total}€`);
                            console.log(`   - Statut: ${firstOrder.status}`);
                            console.log(`   - Articles: ${firstOrder.items_count}`);
                            
                            if (firstOrder.items.length > 0) {
                                const firstItem = firstOrder.items[0];
                                console.log('🛍️ Premier article:');
                                console.log(`   - Nom: ${firstItem.product.name}`);
                                console.log(`   - Marque: ${firstItem.product.brand}`);
                                console.log(`   - Prix: ${firstItem.price_at_purchase}€`);
                            }
                        }
                        
                        console.log('📊 Statistiques:');
                        const stats = response.data.statistics;
                        console.log(`   - Total commandes: ${stats.total_orders}`);
                        console.log(`   - Total dépensé: ${stats.total_spent}€`);
                        console.log(`   - Panier moyen: ${stats.average_order_value.toFixed(2)}€`);
                        
                    } else if (res.statusCode === 401) {
                        console.log('🔐 Erreur 401: Authentification requise (normal)');
                    } else {
                        console.log('❌ Erreur:', response.message || 'Erreur inconnue');
                    }
                    
                } catch (parseError) {
                    console.log('📄 Réponse brute:', data);
                    console.log('❌ Erreur parsing:', parseError.message);
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Erreur requête:', error.message);
            console.log('💡 Assurez-vous que le serveur est démarré');
            reject(error);
        });
        
        req.end();
    });
}

// Exécuter le test
testOrdersRoute()
    .then(() => {
        console.log('\n🏁 Test terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test échoué:', error);
        process.exit(1);
    });
