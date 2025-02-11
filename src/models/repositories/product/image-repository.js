const { Image } = require('../../models/product/image.model.js');

class ImageRepository {
    async create(imageData) {
        return await Image.create(imageData);
    }

    async findById(id) {
        return await Image.findByPk(id);
    }

    async findAll() {
        return await Image.findAll();
    }

    async update(id, updatedData) {
        const image = await Image.findByPk(id);
        if (!image) {
            throw new Error('Image not found');
        }
        return await image.update(updatedData);
    }

    async delete(id) {
        const image = await Image.findByPk(id);
        if (!image) {
            throw new Error('Image not found');
        }
        await image.destroy();
        return true;
    }
}

module.exports = new ImageRepository();
