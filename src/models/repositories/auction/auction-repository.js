const { Auction } = require('../../models/auction/auction.model.js');

class AuctionRepository {
    async create(auctionData) {
        return await Auction.create(auctionData);
    }

    async findById(id) {
        return await Auction.findByPk(id);
    }

    async findAll() {
        return await Auction.findAll();
    }

    async update(id, updatedData) {
        const auction = await Auction.findByPk(id);
        if (!auction) {
            throw new Error('Auction non trouvée');
        }
        return await auction.update(updatedData);
    }

    async delete(id) {
        const auction = await Auction.findByPk(id);
        if (!auction) {
            throw new Error('Auction non trouvée');
        }
        await auction.destroy();
        return true;
    }

    async findActiveAuctions() {
        const now = new Date();
        return await Auction.findAll({
            where: {
                start_date: { [DataTypes.Op.lte]: now }, // start_date <= maintenant
                end_date: { [DataTypes.Op.gte]: now }    // end_date >= maintenant
            }
        });
    }

    async findCompletedAuctions() {
        const now = new Date();
        return await Auction.findAll({
            where: {
                end_date: { [DataTypes.Op.lt]: now }    // end_date < maintenant
            }
        });
    }
}

module.exports = new AuctionRepository();