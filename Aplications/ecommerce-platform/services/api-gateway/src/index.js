const express   = require('express');
const axios     = require('axios');
const rateLimit = require('express-rate-limit');
const jwt       = require('jsonwebtoken');

const app        = express();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const SERVICES = {
    user:    process.env.USER_SERVICE_URL    || 'http://user-service:8081',
    product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:8082',
    order:   process.env.ORDER_SERVICE_URL   || 'http://order-service:8083',
};

app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(express.json());

// ── Auth middleware ────────────────────────────────────────────────
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// ── Proxy factory ──────────────────────────────────────────────────
const forward = (baseUrl) => async (req, res) => {
    try {
        const path = req.originalUrl.replace(/^\/api/, '');
        const url = `${baseUrl}${path}`;

        console.log(`[PROXY] ${req.method} ${req.originalUrl} → ${url}`);
        const response = await axios({
            method:  req.method,
            url,
            data:    req.body,
            headers: {
                'Content-Type':  'application/json',
                'Authorization': req.headers['authorization'] || '',
            },
            timeout:        30000,
            validateStatus: () => true,
        });
        res.status(response.status).json(response.data);
    } catch (err) {
        console.error(`[ERROR] ${err.message}`);
        res.status(502).json({ error: 'Service unavailable', detail: err.message });
    }
};

// ── Health ─────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
    status:    'UP',
    version:   process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
}));

// ── Public routes ──────────────────────────────────────────────────
app.post('/api/users/register',  forward(SERVICES.user));
app.post('/api/users/login',     forward(SERVICES.user));
app.get('/api/categories',       forward(SERVICES.product));
app.get('/api/categories/:slug', forward(SERVICES.product));

// ── Protected routes ───────────────────────────────────────────────
app.use('/api/users',      authenticate, forward(SERVICES.user));
app.use('/api/categories', authenticate, forward(SERVICES.product));
app.use('/api/products',   authenticate, forward(SERVICES.product));
app.use('/api/orders',     authenticate, forward(SERVICES.order));

// ── Start server only when run directly ───────────────────────────
if (require.main === module) {
    app.listen(3000, () => {
        console.log('🚀 API Gateway running on :3000');
        console.log('Services:', SERVICES);
    });
}

module.exports = app;
