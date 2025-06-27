const { Badge } = require('../models/models/gamification/badge.model');
const { UserBadge } = require('../models/models/gamification/user_badge.model');
const { Payment } = require('../models/models/cart/payment.model');
const { PaymentDetail } = require('../models/models/cart/payment_detail.model');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class BadgeAwardService {
    /**
     * Vérifie et attribue les badges pour un achat de drop
     * @param {string} userId - ID de l'utilisateur
     * @param {boolean} isAuction - Si l'achat est une enchère (true) ou un drop (false)
     */
    async checkAndAwardBadges(userId, isAuction = false) {
        try {
            // 1. Compter le nombre d'achats de l'utilisateur par type
            const payments = await Payment.findAll({
                where: { id_user: userId },
                include: [{
                    model: PaymentDetail,
                    as: 'PaymentDetails'  // Changer 'details' en 'PaymentDetails' pour correspondre à l'alias défini
                }]
            });
            
            // Compter les achats par type (drop ou enchère)
            let dropCount = 0;
            let auctionCount = 1;
            
            for (const payment of payments) {
                for (const detail of payment.PaymentDetails) {  // Changer payment.details en payment.PaymentDetails
                        dropCount++;
                }
            }
            
            // 2. Déterminer quels badges doivent être attribués
            const count = isAuction ? auctionCount : dropCount;
            const badgesToCheck = [];
            
            if (isAuction) {
                // Badges pour les enchères
                if (count >= 1) badgesToCheck.push('Premier Enchérisseur');
                if (count >= 5) badgesToCheck.push('Enchérisseur Régulier');
                if (count >= 10) badgesToCheck.push('Enchérisseur Elite');
            } else {
                // Badges pour les drops
                if (count >= 1) badgesToCheck.push('Premier Drop');
                if (count >= 5) badgesToCheck.push('Collectionneur');
                if (count >= 10) badgesToCheck.push('Collectionneur Elite');
            }
            
            // 3. Récupérer les badges à attribuer
            if (badgesToCheck.length > 0) {
                const badges = await Badge.findAll({
                    where: {
                        name: {
                            [Op.in]: badgesToCheck
                        }
                    }
                });
                
                // 4. Vérifier quels badges l'utilisateur possède déjà
                const userBadges = await UserBadge.findAll({
                    where: { id_user: userId }
                });
                
                const userBadgeIds = userBadges.map(ub => ub.id_badge);
                
                // 5. Attribuer les nouveaux badges
                const newBadges = [];
                
                for (const badge of badges) {
                    if (!userBadgeIds.includes(badge.id_badge)) {
                        // Créer une nouvelle attribution de badge
                        await UserBadge.create({
                            id_user_badge: uuidv4(),
                            id_user: userId,
                            id_badge: badge.id_badge
                        });
                        
                        newBadges.push(badge);
                        console.log(`🏆 Badge "${badge.name}" attribué à l'utilisateur ${userId}`);
                    }
                }
                
                return {
                    awarded: newBadges.length > 0,
                    badges: newBadges,
                    counts: {
                        drops: dropCount,
                        auctions: auctionCount
                    }
                };
            }
            
            return {
                awarded: false,
                badges: [],
                counts: {
                    drops: dropCount,
                    auctions: auctionCount
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'attribution des badges:', error);
            return {
                awarded: false,
                error: error.message
            };
        }
    }
}

module.exports = new BadgeAwardService();