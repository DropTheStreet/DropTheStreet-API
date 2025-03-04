const { HistoryAuction } = require('../../models/auction/history_auction.model.js');
const {Auction} = require("../../models/auction/auction.model");
const {Product} = require("../../models/product/product.model");

class HistoryAuctionRepository {
    async create(historyAuctionData) {
        return HistoryAuction.create(historyAuctionData);
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
            throw new Error('HistoryAuction was not found');
        }
        return await historyAuction.update(updatedData);
    }

    async delete(id) {
        const historyAuction = await HistoryAuction.findByPk(id);
        if (!historyAuction) {
            throw new Error('HistoryAuction was not found');
        }
        await historyAuction.destroy();
        return true;
    }

    async findByUserId(userId) {
        return await HistoryAuction.findAll({
            where: { id_user: userId }
        });
    }

    async findHistoryDetailsByUserId(userId) {
        return await HistoryAuction.findAll({
            where: { id_user: userId },
            include: [
                {
                    model: Auction,
                    attributes: ['id_auction', 'initial_price', 'actual_price', 'start_date', 'end_date'],
                    include: [
                        {
                            model: Product,
                            attributes: ['id_product', 'name', 'price']
                        }
                    ]
                }
            ]
        });
    }
}

module.exports = new HistoryAuctionRepository();
