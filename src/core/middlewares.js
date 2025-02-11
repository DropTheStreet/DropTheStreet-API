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
                    { url : "/user/seeder", methods: ["GET"] },
                    { url : "/role/seeder", methods: ["GET"] },
                    { url : "/role/", methods: ["GET"] }
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