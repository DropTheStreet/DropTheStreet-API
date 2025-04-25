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
}

module.exports = new DropRepository();
