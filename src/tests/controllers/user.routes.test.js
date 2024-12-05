const request = require('supertest');
const express = require('express');
const { initializeRoutes } = require('../../controllers/user.routes');
const { sequelize } = require('../../models/mysql.db');

const app = express();
app.use('/users', initializeRoutes());

describe('User Routes', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should create users with /seeder', async () => {
        const response = await request(app).get('/users/seeder');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].pseudo).toBe('adrien');
    });

    it('should get users with /users', async () => {
        const response = await request(app).get('/users');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });
});
