const { Statistic } = require('../../models/statistic/statistic.model.js');
const {Drop} = require("../../models/drop/drop.model");
const {Auction} = require("../../models/auction/auction.model");
const {Product} = require("../../models/product/product.model");
const {ProductImage} = require("../../models/product/product_image.model");
const {Image} = require("../../models/product/image.model");

class StatisticRepository {
    async create(statisticData) {
        return Statistic.create(statisticData);
    }

    async findById(id) {
        return await Statistic.findByPk(id);
    }

    async findAll() {
        return await Statistic.findAll();
    }

    async update(id, updatedData) {
        const statistic = await Statistic.findByPk(id);
        if (!statistic) {
            throw new Error('Statistic was not found');
        }
        return await statistic.update(updatedData);
    }

    async delete(id) {
        const statistic = await Statistic.findByPk(id);
        if (!statistic) {
            throw new Error('Statistic was not found');
        }
        await statistic.destroy();
        return true;
    }

    async findStatisticBySellerId(id_vendor) {
        return await Statistic.findAll({
            where: { id_vendor },
            attributes: ['id_statistic', 'sold_quantity', 'id_vendor', 'id_product', 'id_drop', 'id_auction'],
            include: [
                {
                    model: Drop,
                    attributes: ['price', 'is_premium']
                },
                {
                    model: Auction,
                    attributes: ['actual_price', 'initial_price']
                },
                {
                    model: Product,
                    attributes: ['name', 'description'],
                }
            ]
        });
    }

}

module.exports = new StatisticRepository();