const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const { User } = require('../models/user.model.js');

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
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(body.password, salt);

    const user = body;
    user.id_user = uuid.v4();

    user.password = hash;

    let finalUser = await User.create(user);

    return `${finalUser}`;
};