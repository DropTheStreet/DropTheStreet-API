const { Drop } = require('../../models/drop/drop.model.js');
const {Product} = require("../../models/product/product.model");
const {Op} = require("sequelize");

class DropRepository {
    async create(dropData) {
        return Drop.create(dropData);
    }

    async findById(id) {
        return await Drop.findByPk(id);
    }

    async findAll() {
        return await Drop.findAll();
    }

    async update(id, updatedData) {
        const drop = await Drop.findByPk(id);
        if (!drop) {
            throw new Error('Drop was not found');
        }
        return await drop.update(updatedData);
    }

    async delete(id) {
        const drop = await Drop.findByPk(id);
        if (!drop) {
            throw new Error('Drop was not found');
        }
        await drop.destroy();
        return true;
    }

    async findUpcomingDropWithProduct() {
        const now = new Date();

        return await Drop.findOne({
            where: {
                start_date: {
                    [Op.gt]: now
                }
            },
            include: [
                {
                    model: Product,
                    required: true
                }
            ],
            order: [['start_date', 'ASC']]
        });
    }

    async findTodayDropsWithProductAndProject() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return await Drop.findAll({
            where: {
                start_date: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            include: [
                {
                    model: Product,
                    required: true
                }
            ],
            order: [['start_date', 'ASC']],
            limit: 3
        });
    }

    async findDropDetails(id) {
        return await Drop.findByPk(id, {
            include: [
                {
                    model: Product,
                    required: true
                },
            ]
        });
    }


}

module.exports = new DropRepository();
