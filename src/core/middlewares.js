const express = require('express');
const { DateTime } = require('luxon');
const cors = require('cors')
const { expressjwt: jwt } = require("express-jwt");
require('dotenv').config()

const initJsonHandlerMiddlware = (app) => app.use(express.json());
const staticMiddlware = (app) => app.use(express.static('public'));
const corsMiddlware = (app) => {
    const corsOptions = {
        origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };

    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
};

const initLoggerMiddlware = (app) => {
    app.use((req, res, next) => {
        const begin = new DateTime(new Date());

        res.on('finish', () => {
            const requestDate = begin.toString();
            const remoteIP = `IP: ${req.connection.remoteAddress}`;
            const httpInfo = `${req.method} ${req.baseUrl || req.path}`;

            const end = new DateTime(new Date());
            const requestDurationMs = end.diff(begin).toMillis();
            const requestDuration = `Duration: ${requestDurationMs}ms`;

            console.log(`[${requestDate}] - [${remoteIP}] - [${httpInfo}] - [${requestDuration}]`);
        })
        next();
    });
};

const tokenMiddlware = (app) => {
    app.use(
        jwt({
            secret: process.env.SECRET_KEY,
            algorithms: ["HS256"],
            // Extraire le token du header Authorization
            getToken: function fromHeaderOrQuerystring(req) {
                if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                    return req.headers.authorization.split(' ')[1];
                }
                return null;
            },
            // Personnaliser l'objet utilisateur
            userProperty: 'user' // Assurez-vous que cette propriété est définie sur 'user'
        }).unless(
            { path: [
                    { url : "/", methods: ["GET"] },
                    { url: "/user/", methods: ["GET"] },
                    { url : "/user/seeder", methods: ["POST"] },
                    { url : "/user/login", methods: ["POST"] },
                    { url : "/role/seeder", methods: ["POST"] },
                    { url : "/role/", methods: ["GET"] },
                    { url: "/support/seeder", methods: ["POST"] },
                    { url: "/support/", methods: ["GET"] },
                    { url: "/statistic/", methods: ["GET"] },
                    { url: "/statistic/seeder", methods: ["POST"] },
                    { url: "/product/", methods: ["GET"] },
                    { url: "/product/seeder", methods: ["POST"] },
                    { url: "/category/", methods: ["GET"] },
                    { url: "/category/seeder", methods: ["POST"] },
                    { url: "/brand/seeder", methods: ["POST"] },
                    { url: "/image/", methods: ["GET"] },
                    { url: "/image/seeder", methods: ["POST"] },
                    { url: "/favorite/", methods: ["GET"] },
                    { url: "/favorite/seeder", methods: ["POST"] },
                    { url: "/product-image/", methods: ["GET"] },
                    { url: "/product-image/seeder", methods: ["POST"] },
                    { url: "/notification/", methods: ["GET"] },
                    { url: "/notification/seeder", methods: ["POST"] },
                    { url: "/notification-type/", methods: ["GET"] },
                    { url: "/notification-type/seeder", methods: ["POST"] },
                    { url: "/badge/", methods: ["GET"] },
                    { url: "/badge/seeder", methods: ["POST"] },
                    { url: "/user-badge/", methods: ["GET"] },
                    { url: "/user-badge/seeder", methods: ["POST"] },
                    { url: "/challenge/", methods: ["GET"] },
                    { url: "/challenge/seeder", methods: ["POST"] },
                    { url: "/user-challenge/", methods: ["GET"] },
                    { url: "/user-challenge/seeder", methods: ["POST"] },
                    { url: "/drop/", methods: ["GET"] },
                    { url: "/drop/seeder", methods: ["POST"] },
                    { url: "/cart/", methods: ["GET"] },
                    { url: "/cart/seeder", methods: ["POST"] },
                    { url: "/payment-status/", methods: ["GET"] },
                    { url: "/payment-status/seeder", methods: ["POST"] },
                    { url: "/payment/", methods: ["GET"] },
                    { url: "/payment/seeder", methods: ["POST"] },
                    { url: "/auction/", methods: ["GET"] },
                    { url: "/auction/seeder", methods: ["POST"] },
                    { url: "/history-auction/", methods: ["GET"] },
                    { url: "/history-auction/seeder", methods: ["POST"] },
                    { url: "/all/seeder", methods: ["POST"] },
                    { url: "/user/register", methods: ["POST"] },
                    { url: "/user/forgot-password", methods: ["POST"] },
                    { url: /^\/user\/reset-password\/.*/, methods: ["POST"] }, // 🔥 Exclusion avec regex
                    { url: "/user/auth/google", methods: ["GET"] },
                    { url: "/user/auth/google/callback", methods: ["GET"] },
                ]
            })
    );

    // Middleware pour gérer les erreurs d'authentification
    app.use((err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
            console.error('Auth error:', err);
            return res.status(401).json({ message: 'Invalid token or no token provided' });
        }
        next(err);
    });
}

exports.initializeConfigMiddlewares = (app) => {
    initJsonHandlerMiddlware(app);
    initLoggerMiddlware(app);
    staticMiddlware(app);
    corsMiddlware(app);
    tokenMiddlware(app);
}

exports.initializeErrorMiddlwares = (app) => {
    app.use((err, req, res, next) => {
        if (err.code === 'permission_denied') {
            res.status(403).send('Forbidden');
            return
        }
        console.log(err)
        res.status(500).send(err.message);
    });
}