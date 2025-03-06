const uuid = require('uuid');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../../models/user/user.model.js');
const {Role} = require("../../models/user/role.model");
const {UserBadge} = require("../../models/gamification/user_badge.model");
const {Badge} = require("../../models/gamification/badge.model");
const {HistoryAuction} = require("../../models/auction/history_auction.model");
const {Auction} = require("../../models/auction/auction.model");
const {Payment} = require("../../models/cart/payment.model");
const {ShoppingCart} = require("../../models/cart/shopping_cart.model");

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
    return await User.findOne({
        where: { id_user },
        include: [
            {
                model: UserBadge,
                include: [
                    {
                        model: Badge
                    }
                ]
            }
        ]
    });
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

exports.uploadUserPhoto = async (id_user, photoBuffer) => {
    return await User.update({ photo: photoBuffer }, { where: { id_user } });
};

exports.loginUser = async (email, password) => {
    try {
        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, as: 'role', attributes: ['name'] }],
        });

        if (!user) {
            console.error('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error('Invalid email or password');
        }

        const token = jwt.sign(
            { id_user: user.id_user, email: user.email, role: user.role.name },
            SECRET_KEY,
            { expiresIn: EXPIRES_IN }
        );

        return { token, user };
    } catch (error) {
        console.error('Login error:', error.message);
        throw error;
    }
};

exports.updateUser = async (id, { pseudo, email, bio, password }) => {
    const user = await this.getUserById(id);

    if (!user) {
        throw new Error('User not found');
    }

    if (pseudo) user.pseudo = pseudo;
    if (email) user.email = email;
    if (bio) user.bio = bio;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    return user;
};


exports.updateUserByAdmin = async (id, { pseudo, email, bio, role, dropcoins }) => {
    const user = await this.getUserById(id);

    if (!user) {
        throw new Error('User not found');
    }

    if (role) {
        const roleData = await Role.findOne({ where: { name: role } });

        if (!roleData) {
            throw new Error(`Role "${role}" not found`);
        }

        user.id_role = roleData.id_role;
    }

    if (pseudo) user.pseudo = pseudo;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (dropcoins) user.dropcoins = dropcoins;

    await user.save();
    return user;
};


exports.createUserByAdmin = async (body) => {
    try {
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(body.password, salt);

        const user = {
            id_user: body.id_user || uuid.v4(),
            pseudo: body.pseudo,
            email: body.email,
            password: hash,
            dropcoins: body.dropcoins ?? 10,
        };

        if (body.role) {
            const roleData = await Role.findOne({ where: { name: body.role } });

            if (!roleData) {
                throw new Error(`Role "${body.role}" not found`);
            }
            user.id_role = roleData.id_role;
        } else {
            throw new Error("Role is required");
        }

        return await User.create(user);
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

exports.updateGoogleUser = async (id, { pseudo, bio }) => {
    const user = await this.getUserById(id);

    if (!user) {
        throw new Error('User not found');
    }

    if (pseudo) user.pseudo = pseudo;
    if (bio) user.bio = bio;

    await user.save();
    return user;
};

exports.getUsersByRoleName = async (roleName) => {
    try {
        return await User.findAll({
            include: [
                {
                    model: Role,
                    as: 'role',
                    where: { name: roleName },
                    attributes: []
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching users by role name:', error);
        throw error;
    }
};

exports.deleteUserById = async (id_user) => {
    try {
        const user = await User.findByPk(id_user);
        if (!user) {
            throw new Error("User not found");
        }

        await UserBadge.destroy({ where: { id_user } });
        await HistoryAuction.destroy({ where: { id_user } });
        await Auction.destroy({ where: { id_user } });
        await Payment.destroy({ where: { id_user } });
        await Payment.destroy({ where: { id_seller: id_user } });
        await ShoppingCart.destroy({ where: { id_user } });
        await User.destroy({ where: { id_user } });

        return { message: "User deleted successfully" };
    } catch (error) {
        throw new Error(`Error deleting user: ${error.message}`);
    }
};

