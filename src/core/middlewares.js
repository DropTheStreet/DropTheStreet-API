const express = require('express');
const { DateTime } = require('luxon');
const cors = require('cors')
const { expressjwt: jwt } = require("express-jwt");
require('dotenv').config()

const initJsonHandlerMiddlware = (app) => app.use(express.json());
const staticMiddlware = (app) => app.use(express.static('public'));
const corsMiddlware = (app) => app.use(cors());

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
        }).unless(
            { path: [
                    { url : "/", methods: ["GET"] },
                    { url: "/user", methods: ["GET"] },
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
                    { url: "/all/seeder", methods: ["POST"] },
                ]
            })
    );
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