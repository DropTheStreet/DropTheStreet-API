const express = require('express');
const userRoutes = require('../controllers/user.routes');
const { sequelize } = require('../models/mysql.db')
const http = require('http');
const {initializeConfigMiddlewares, initializeErrorMiddlwares} = require("./middlewares");

class WebServer {
    app = undefined;
    port = process.env.PORT;
    server = undefined;
    io = undefined;

    constructor() {
        this.app = express();
        require('dotenv').config();

        sequelize.sync();
        // sequelize.sync({ force: true });

        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        initializeErrorMiddlwares(this.app);
    }

    start() {
        this.server = http.createServer(this.app);
        this.server.listen(this.port, () => {
            console.log(`Example app listening on port ${this.port}`);
        });
        console.log(process.env.NODE_ENV);
    }

    stop() {
        this.server.close();
    }

    _initializeRoutes() {
        this.app.use('/users', userRoutes.initializeRoutes());
    }
}

module.exports = WebServer;