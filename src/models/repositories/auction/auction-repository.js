const { Auction } = require('../../models/auction/auction.model.js');
const {DataTypes, Op} = require("sequelize");
const {Product} = require("../../models/product/product.model");
const {ProductImage} = require("../../models/product/product_image.model");
const {Image} = require("../../models/product/image.model");
const {Category} = require("../../models/product/category.model");
const {Brand} = require("../../models/product/brand.model");

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
                    attributes: ['name'],
                    include: [
                        {
                            model: Category,
                            attributes: ['name']
                        },
                        {
                            model: Brand,
                            attributes: ['name']
                        },
                        {
                            model: ProductImage,
                            include: [
                                { model: Image }
                            ]
                        }
                    ]
                }
            ]
        });

        return auctions;
    }

    async findByIdWithDetails(id) {
        const auction = await Auction.findByPk(id, {
            include: [
                {
                    model: Product,
                    include: [
                        {
                            model: Category,
                            attributes: ['name']
                        },
                        {
                            model: Brand,
                            attributes: ['name']
                        },
                        {
                            model: ProductImage,
                            include: [
                                { model: Image }
                            ]
                        }
                    ]
                }
            ]
        });
        return auction;
    }

    async findBySellerId(id_user) {
        if (!id_user) {
            throw new Error('id_user is required');
        }

        return await Auction.findAll({
            where: { id_user },
            include: [
                {
                    model: Product,
                    attributes: ['name'],
                    include: [
                        {
                            model: Category,
                            attributes: ['name']
                        },
                        {
                            model: Brand,
                            attributes: ['name']
                        },
                        {
                            model: ProductImage,
                            include: [
                                { model: Image }
                            ]
                        }
                    ]
                }
            ]
        });
    }

}

module.exports = new AuctionRepository();