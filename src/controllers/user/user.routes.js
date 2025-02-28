const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const {User } = require('../../models/models/user/user.model');
const {Role} = require("../../models/models/user/role.model");
const RoleRepository = require("../../models/repositories/user/role-repository");
const UserRepository = require("../../models/repositories/user/user-repository");
const {loginUser, getUserById, uploadUserPhoto} = require("../../models/repositories/user/user-repository");
const {createTransport} = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const {memoryStorage} = require("multer");
const multer = require("multer");
const {UserBadge} = require("../../models/models/gamification/user_badge.model");
const {Badge} = require("../../models/models/gamification/badge.model");

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
            attributes: ['id_user', 'pseudo', 'email'], // Sélectionne les champs de User
            include: [{ model: Role, as: 'role', attributes: ['name'] }],
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
                role: user.role.name
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

        const badge = await Badge.findOne({ where: { name: 'DropStreeter débutant' } });

        if (badge) {
            await UserBadge.create({
                id_user: user.id_user,
                id_badge: badge.id_badge
            });
        } else {
            console.error("Badge 'DropStreeter débutant' not found.");
        }

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

    const resetToken = uuidv4();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
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

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL}/user/auth/google/callback`,
        passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            // Rechercher l'utilisateur par son googleId
            let user = await User.findOne({ where: { googleId: profile.id } });

            if (!user) {
                // Si l'utilisateur n'existe pas, vérifier par email
                const email = profile.emails[0].value;
                const existingUser = await User.findOne({ where: { email } });

                if (existingUser) {
                    // Si l'email existe déjà, mettre à jour avec googleId
                    existingUser.googleId = profile.id;
                    if (profile.photos && profile.photos.length > 0) {
                        existingUser.photo = profile.photos[0].value;
                    }
                    await existingUser.save();
                    return done(null, existingUser);
                }

                // Créer un nouvel utilisateur
                const userRoleId = await RoleRepository.findIdByName("User");
                const pseudo = profile.displayName || email.split('@')[0];

                // Vérifier si le pseudo existe déjà
                const existingPseudo = await User.findOne({ where: { pseudo } });
                let finalPseudo = pseudo;
                if (existingPseudo) {
                    // Ajouter un suffixe aléatoire au pseudo
                    finalPseudo = `${pseudo}${Math.floor(Math.random() * 1000)}`;
                }

                    const newUser = await User.create({
                    pseudo: finalPseudo,
                    email: email,
                    googleId: profile.id,
                    bio: "",
                    photo: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
                    dropcoins: 10,
                    id_role: userRoleId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                const badge = await Badge.findOne({ where: { name: 'DropStreeter débutant' } });

                if (badge) {
                    await UserBadge.create({
                        id_user: newUser.id_user,
                        id_badge: badge.id_badge
                    });
                } else {
                    console.error("Badge 'DropStreeter débutant' not found.");
                }

                return done(null, newUser);
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));

// Sérialisation et désérialisation de passport
passport.serializeUser((user, done) => {
    done(null, user.id_user);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth` }),
    async (req, res) => {
        try {
            // Générer un JWT pour l'utilisateur
            const token = jwt.sign(
                { id_user: req.user.id_user, email: req.user.email, role: await RoleRepository.findNameById(req.user.id_role) },
                process.env.SECRET_KEY,
                { expiresIn: '24h' }
            );

            // Rediriger vers le frontend avec le token
            res.redirect(`${process.env.FRONTEND_URL}/authentification?token=${token}`);
        } catch (error) {
            console.error("Erreur lors de l'authentification Google:", error);
            res.redirect(`${process.env.FRONTEND_URL}/authentification?error=auth_failed`);
        }
    }
);
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.put('/upload-photo/:id_user', upload.single('photo'), async (req, res) => {
    try {
        const userId = req.params.id_user;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const photoBuffer = req.file.buffer;
        await uploadUserPhoto(userId, photoBuffer);

        return res.status(200).json({ message: 'Profile photo updated successfully' });
    } catch (error) {
        console.error('Error uploading photo:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

const validatePassword = async (userId, password) => {
    const user = await User.findOne({ where: { id_user: userId } });
    if (!user) {
        throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid password');
    }

    return true;
};

router.put('/update/:id_user', async (req, res) => {
    try {
        const { pseudo, email, bio, password } = req.body;
        const { id_user } = req.params;

        if (!pseudo || !email || !password) {
            return res.status(400).json({ message: 'Pseudo, email et mot de passe sont requis' });
        }

        await validatePassword(id_user, password);

        const updatedUser = await UserRepository.updateUser(id_user, { pseudo, email, bio, password });
        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (e) {
        console.error(e);
        res.status(400).json({ message: e.message || 'Error updating user' });
    }
});


router.put('/update-google/:id_user', async (req, res) => {
    try {
        const { pseudo, bio } = req.body;
        const { id_user } = req.params;

        if (!pseudo) {
            return res.status(400).json({ message: 'Pseudo est requis' });
        }

        const updatedUser = await UserRepository.updateGoogleUser(id_user, { pseudo, bio });
        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (e) {
        console.error(e);
        res.status(400).json({ message: e.message || 'Error updating user' });
    }
});

module.exports = {
    initializeRoutes: () => router,
};