const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const { User } = require('../../models/user/user.model.js');

exports.getUsers = async () => await User.findAll();

exports.getUserByPseudo = async (pseudo) => {
    return await User.findOne({ where: { pseudo } });
};

exports.getUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

exports.getUserById = async (id_user) => {
    return await User.findOne({ where: { id_user } });
};

exports.getIdUserByEmail = async (email) => {
    let user = await User.findOne({ where: { email } });
    return `${user.id_user}`
};

exports.createUser = async (body) => {
    try {
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(body.password, salt);

        const user = {
            id_user: body.id_user || uuid.v4(),
            pseudo: body.pseudo,
            email: body.email,
            password: hash,
            dropcoins: body.dropcoins ?? 10, // Default dropcoins for account creation
            id_role: body.id_role,
            bio: body.bio ?? null,
            photo: body.photo ?? null,
        };

        return await User.create(user);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};