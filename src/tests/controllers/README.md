# Tests Unitaires de Toutes les Routes API

Ce dossier contient les tests unitaires complets pour toutes les routes de l'API DropTheStreet.

## Vue d'ensemble

### 📊 Statistiques Globales
- **10 fichiers de tests** créés
- **143 tests** au total
- **100% de réussite**
- **Couverture complète** de toutes les routes principales
- **Temps d'exécution** : ~15 secondes pour tous les tests

## Structure des Tests

### 🧪 Routes testées

### 1. **Drop Routes** (26 tests) ✅
- POST /seeder - Création de données de test
- POST / - Création d'un drop
- GET /:id/details - Récupération des détails d'un drop
- GET /vendor/:id_vendor - Récupération des drops d'un vendeur
- PUT /:id - Mise à jour d'un drop
- DELETE /:id - Suppression d'un drop
- GET / - Récupération de tous les drops
- GET /next - Récupération du prochain drop
- GET /today - Récupération des drops du jour
- GET /category - Récupération des catégories

### 2. **Auction Routes** (22 tests) ✅
- POST /seeder - Création de données de test d'enchères
- GET / - Récupération de toutes les enchères
- POST /create - Création d'une enchère via repository
- GET /active - Récupération des enchères actives
- GET /:id - Récupération d'une enchère par ID
- GET /:id/details - Récupération des détails d'une enchère
- PUT /update/:id - Mise à jour via repository
- GET /seller/:id_user - Récupération des enchères d'un vendeur
- DELETE /delete/:id - Suppression d'une enchère
- POST /add - Création directe via modèle

### 3. **User Routes** (4 tests) ✅
- POST /seeder - Création d'utilisateurs de test
- GET / - Récupération de tous les utilisateurs
- Tests d'erreur pour les deux routes

### 4. **Support Routes** (8 tests) ✅
- POST /seeder - Création de tickets de support de test
- GET / - Récupération de tous les tickets de support
- Tests de gestion des doublons et erreurs

### 5. **Role Routes** (8 tests) ✅
- POST /seeder - Création de rôles de test
- GET / - Récupération de tous les rôles
- Tests de gestion des doublons et erreurs

### 6. **Category Routes** (11 tests) ✅
- GET / - Récupération de toutes les catégories
- POST / - Création d'une nouvelle catégorie
- GET /:id - Récupération d'une catégorie par ID
- Tests de validation et gestion d'erreurs

### 7. **Brand Routes** (11 tests) ✅
- POST /seeder - Création de marques de test
- GET / - Récupération de toutes les marques
- POST / - Création d'une nouvelle marque
- GET /:id - Récupération d'une marque par ID
- Tests de validation et gestion d'erreurs

### 8. **Badge Routes** (8 tests) ✅
- POST /seeder - Création de badges de test
- GET / - Récupération de tous les badges
- Tests de gestion d'erreurs

### 9. **Challenge Routes** (8 tests) ✅
- POST /seeder - Création de défis de test
- GET / - Récupération de tous les défis
- Tests de gestion d'erreurs

### 10. **Chat Routes** (37 tests) ✅
- POST /seeder - Création de messages de test
- GET /history - Récupération de l'historique du chat
- GET /stats - Récupération des statistiques du chat
- GET /search - Recherche de messages
- GET / - Récupération de tous les messages (admin)
- DELETE /:messageId - Suppression d'un message
- POST /message - Création d'un message via REST
- GET /recent - Récupération des messages récents
- Tests complets de validation et gestion d'erreurs

## Approche de Test

### Mocking
- Tous les modèles Sequelize sont mockés pour éviter les dépendances de base de données
- Le repository DropRepository est mocké pour contrôler les réponses
- Les tests sont isolés et rapides

### Données de Test
- Utilisation de données mockées cohérentes
- Chaque test configure ses propres mocks selon ses besoins
- Nettoyage des mocks entre chaque test

### Couverture
- Tests des cas de succès
- Tests des cas d'erreur (404, 400, 500)
- Validation des formats de réponse
- Vérification des appels aux modèles/repositories

## Exécution des Tests

```bash
# Exécuter tous les tests drop
npm test -- src/tests/controllers/drop.routes.test.js

# Exécuter avec couverture
npm test -- --coverage src/tests/controllers/drop.routes.test.js

# Exécuter en mode watch
npm test -- --watch src/tests/controllers/drop.routes.test.js
```

## Résultats

- **26 tests** au total
- **100% de réussite**
- Couverture complète des routes et cas d'usage
- Tests rapides (< 2 secondes)

## Configuration

Les tests utilisent :
- **Jest** comme framework de test
- **Supertest** pour les tests d'API
- **Mocks** pour isoler les dépendances
- **Express** pour créer l'application de test

## Tests des Routes Auction

### Routes testées

1. **POST /seeder** - Création de données de test d'enchères
   - ✅ Création réussie d'enchères de test
   - ✅ Erreur si pas assez de produits
   - ✅ Erreur si pas assez d'utilisateurs

2. **GET /** - Récupération de toutes les enchères
   - ✅ Récupération réussie
   - ✅ Gestion des erreurs de base de données

3. **POST /create** - Création d'une enchère via repository
   - ✅ Création réussie via repository
   - ✅ Gestion des erreurs du repository

4. **GET /active** - Récupération des enchères actives
   - ✅ Récupération des enchères actives
   - ✅ Gestion des erreurs du repository

5. **GET /:id** - Récupération d'une enchère par ID
   - ✅ Récupération réussie
   - ✅ Erreur 404 si enchère non trouvée
   - ✅ Gestion des erreurs du repository

6. **GET /:id/details** - Récupération des détails d'une enchère
   - ✅ Récupération des détails avec produit
   - ✅ Erreur 404 si enchère non trouvée

7. **PUT /update/:id** - Mise à jour via repository
   - ✅ Mise à jour réussie
   - ✅ Gestion des erreurs du repository

8. **GET /seller/:id_user** - Récupération des enchères d'un vendeur
   - ✅ Récupération réussie
   - ✅ Gestion des erreurs du repository

9. **DELETE /delete/:id** - Suppression d'une enchère
   - ✅ Suppression réussie
   - ✅ Gestion des erreurs du repository

10. **POST /add** - Création directe via modèle
    - ✅ Création réussie
    - ✅ Gestion des erreurs de base de données

### Résultats Auction

- **22 tests** au total
- **100% de réussite**
- Couverture complète des routes et cas d'usage
- Tests rapides (< 2 secondes)

## Notes Techniques

- Les dates sont automatiquement sérialisées en ISO string par Express
- Les erreurs console.error sont normales dans les tests d'erreur
- Les mocks sont réinitialisés avant chaque test
- Pas de base de données réelle nécessaire
- Note: Il y a une route PUT /update/:id dupliquée dans le code source - seule la première (repository) est testée
