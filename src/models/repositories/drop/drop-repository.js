const { Drop } = require('../../models/drop/drop.model.js');

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
}

module.exports = new DropRepository();
