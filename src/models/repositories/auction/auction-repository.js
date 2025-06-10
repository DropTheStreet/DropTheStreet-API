const { Auction } = require('../../models/auction/auction.model.js');
const {DataTypes, Op} = require("sequelize");
const {Product} = require("../../models/product/product.model");
const {ProductImage} = require("../../models/product/product_image.model");
const {Image} = require("../../models/product/image.model");

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

    async findActiveAuctions() {
        const auctions = await Auction.findAll({
            where: {
                end_date: {
                    [Op.gte]: new Date()
                }
            },
            include: [
                {
                    model: Product,
                    include: [
                        {
                            model: ProductImage,
                            include: [
                                {model: Image}
                            ]
                        }
                    ]
                }
            ]
        });

        return auctions;
    }
}

module.exports = new AuctionRepository();