const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { User } = require('../../models/models/user/user.model');
const {Role} = require("../../models/models/user/role.model");
const RoleRepository = require("../../models/repositories/user/role-repository");
const {loginUser} = require("../../models/repositories/user/user-repository");
const {createTransport} = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

router.post('/seeder', async (req, res) => {
    try {
        const roles = await Role.findAll();
        const roleMap = {};
        roles.forEach(role => {
            roleMap[role.name] = role.id_role;
        });

        const usersToCreate = [
            {
                pseudo: 'admin',
                email: 'admin@gmail.com',
                password: 'admin',
                bio: 'admin',
                dropcoins: 0,
                roleName: 'Admin',
            },
            {
                pseudo: 'user',
                email: 'user@gmail.com',
                password: 'user',
                bio: 'Bio d\'User',
                dropcoins: 100,
                roleName: 'User',
            },
            {
                pseudo: 'seller',
                email: 'seller@gmail.com',
                password: 'seller',
                bio: 'Bio de Seller',
                dropcoins: 200,
                roleName: 'Seller',
            }
        ];

        const hashedUsers = await Promise.all(usersToCreate.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return {
                ...user,
                password: hashedPassword,
                id_role: roleMap[user.roleName],
            };
        }));

        for (let user of hashedUsers) {
            const existingUser = await User.findOne({ where: { email: user.email } });
            if (existingUser) {
                console.log(`User ${user.email} already exists. Skipping creation.`);
            } else {
                await User.create({
                    pseudo: user.pseudo,
                    email: user.email,
                    password: user.password,
                    bio: user.bio,
                    photo: null,
                    dropcoins: user.dropcoins,
                    id_role: user.id_role,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`User ${user.email} created successfully.`);
            }
        }

        const users = await User.findAll({
            order: [['pseudo', 'ASC']],
        });

        res.status(200).send(users);
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: 'Error creating users', error: e.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['pseudo', 'ASC']],
        });
        res.status(200).send(users);
    } catch (e) {
        res.status(500).send({ message: 'Error during getting of users', error: e.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const { token, user } = await loginUser(email, password);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id_user: user.id_user,
                pseudo: user.pseudo,
                email: user.email,
                bio: user.bio,
                dropcoins: user.dropcoins,
                id_role: user.id_role
            }
        });
    } catch (error) {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { pseudo, email, password } = req.body;

        if (!pseudo || !email || !password) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        const existingPseudo = await User.findOne({ where: { pseudo } });
        if (existingPseudo) {
            return res.status(400).json({ message: "Ce pseudo est déjà utilisé." });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            pseudo,
            email,
            password: hashedPassword,
            bio: "",
            photo: null,
            dropcoins: 10,
            id_role: await RoleRepository.findIdByName("User"),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({ message: "Utilisateur créé avec succès", user });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Erreur serveur", error: e.message });
    }
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    const resetToken = uuidv4();  // Génération du token
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // Expire dans 1h
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: '"Support DropTheStreet" <support@dropthestreet.com>',
        to: user.email,
        subject: "Réinitialisation du mot de passe",
        text: `Cliquez ici pour réinitialiser votre mot de passe: ${resetLink}`,
        html: `<p>Cliquez ici pour réinitialiser votre mot de passe :</p>
               <a href="${resetLink}">Réinitialiser le mot de passe</a>`,
    });

    res.json({ message: "Un email a été envoyé." });
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({
            where: {resetToken: token}
        });

        if (!user || user.resetTokenExpiry <= Date.now()) {
            return res.status(400).json({message: "Lien de réinitialisation invalide ou expiré."});
        }
        if (await bcrypt.compare(password, user.password))
            return res.status(400).json({ message: "Le mot de passe doit être différent du précédent" });

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        res.json({ message: "Mot de passe mis à jour avec succès !" });
    } catch (error) {
        console.error("Erreur lors de la réinitialisation :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});


module.exports = {
    initializeRoutes: () => router,
};