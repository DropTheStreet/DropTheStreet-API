const { Role } = require('../../models/user/role.model.js');

class RoleRepository {
    async create(roleData) {
        return Role.create(roleData);
    }

    async findById(id) {
        return await Role.findByPk(id);
    }

    async findAll() {
        return await Role.findAll();
    }

    async update(id, updatedData) {
        const role = await Role.findByPk(id);
        if (!role) {
            throw new Error('Role was not found');
        }
        return await role.update(updatedData);
    }

    async delete(id) {
        const role = await Role.findByPk(id);
        if (!role) {
            throw new Error('Role was not found');
        }
        await role.destroy();
        return true;
    }
}

module.exports = new RoleRepository();
