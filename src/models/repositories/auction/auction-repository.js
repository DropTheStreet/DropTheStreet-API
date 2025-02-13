const { Auction } = require('../../models/auction/auction.model.js');
const {DataTypes} = require("sequelize");

class AuctionRepository {
    async create(auctionData) {
        return Auction.create(auctionData);
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
            throw new Error('Auction was not found');
        }
        return await auction.update(updatedData);
    }

    async delete(id) {
        const auction = await Auction.findByPk(id);
        if (!auction) {
            throw new Error('Auction was not found');
        }
        await auction.destroy();
        return true;
    }
}

module.exports = new AuctionRepository();