const request = require('supertest');
const app     = require('../index');

describe('API Gateway', () => {

    test('GET /health returns 200', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('UP');
    });

    test('Protected routes reject missing token', async () => {
        const res = await request(app).get('/api/orders');
        expect(res.status).toBe(401);
    });

    test('Protected routes reject invalid token', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(403);
    });

});
