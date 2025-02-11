const { HistoryAuction } = require('../../models/auction/history_auction.model.js');

class HistoryAuctionRepository {
    async create(historyAuctionData) {
        return await HistoryAuction.create(historyAuctionData);
    }

    async findById(id) {
        return await HistoryAuction.findByPk(id);
    }

    async findAll() {
        return await HistoryAuction.findAll();
    }

    async findByAuctionId(auctionId) {
        return await HistoryAuction.findAll({
            where: { id_auction: auctionId }
        });
    }

    async update(id, updatedData) {
        const historyAuction = await HistoryAuction.findByPk(id);
        if (!historyAuction) {
            throw new Error('HistoryAuction non trouvé');
        }
        return await historyAuction.update(updatedData);
    }

    async delete(id) {
        const historyAuction = await HistoryAuction.findByPk(id);
        if (!historyAuction) {
            throw new Error('HistoryAuction non trouvé');
        }
        await historyAuction.destroy();
        return true;
    }

    async findByUserId(userId) {
        return await HistoryAuction.findAll({
            where: { id_user: userId }
        });
    }
}

module.exports = new HistoryAuctionRepository();
