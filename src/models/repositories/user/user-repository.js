const uuid = require('uuid');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../../models/user/user.model.js');
const {Role} = require("../../models/user/role.model");

const SECRET_KEY = process.env.SECRET_KEY;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

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

exports.loginUser = async (email, password) => {
    try {
        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, attributes: ['name'] }]
        });
        if (!user) {
            console.error('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error('Invalid email or password');
        }

        const token = jwt.sign(
            { id_user: user.id_user, email: user.email, role: user.Role.name },
            SECRET_KEY,
            { expiresIn: EXPIRES_IN }
        );

        return { token, user };
    } catch (error) {
        console.error('Login error:', error.message);
        throw error;
    }
};