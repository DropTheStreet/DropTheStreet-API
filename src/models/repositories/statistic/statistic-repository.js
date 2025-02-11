const { Statistic } = require('../../models/statistic/statistic.model.js');

class StatisticRepository {
    async create(statisticData) {
        return await Statistic.create(statisticData);
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
            throw new Error('Statistic not found');
        }
        return await statistic.update(updatedData);
    }

    async delete(id) {
        const statistic = await Statistic.findByPk(id);
        if (!statistic) {
            throw new Error('Statistic not found');
        }
        await statistic.destroy();
        return true;
    }
}

module.exports = new StatisticRepository();