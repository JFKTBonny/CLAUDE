const express   = require('express');
const axios     = require('axios');
const rateLimit = require('express-rate-limit');
const jwt       = require('jsonwebtoken');

const app        = express();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const SERVICES = {
    user:         process.env.USER_SERVICE_URL         || 'http://user-service:8081',
    product:      process.env.PRODUCT_SERVICE_URL      || 'http://product-service:8082',
    order:        process.env.ORDER_SERVICE_URL        || 'http://order-service:8083',
    cart:         process.env.CART_SERVICE_URL         || 'http://cart-service:8085',
    payment:      process.env.PAYMENT_SERVICE_URL      || 'http://payment-service:8086',
    shipping:     process.env.SHIPPING_SERVICE_URL     || 'http://shipping-service:8087',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8088',
};

app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(express.json());

app.use((req, res, next) => {
    req.fullPath = req.originalUrl;
    next();
});

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

const forward = (baseUrl) => async (req, res) => {
    try {
        const url = `${baseUrl}${req.fullPath}`;
        console.log(`[PROXY] ${req.method} ${req.fullPath} -> ${url}`);
        const response = await axios({
            method:  req.method,
            url,
            data:    req.body,
            headers: {
                'Content-Type':  'application/json',
                'Authorization': req.headers['authorization'] || '',
                'X-User-Role':   req.user ? req.user.role || 'customer' : 'guest',
                'X-User-Id':     req.user ? String(req.user.userId) : '',
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

app.get('/health', (_, res) => res.json({
    status:    'UP',
    version:   process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
}));

app.post('/api/users/register',  forward(SERVICES.user));
app.post('/api/users/login',     forward(SERVICES.user));
app.get('/api/categories',       forward(SERVICES.product));
app.get('/api/categories/:slug', forward(SERVICES.product));

app.use('/api/users',      authenticate, forward(SERVICES.user));
app.use('/api/categories', authenticate, forward(SERVICES.product));
app.use('/api/products',   authenticate, forward(SERVICES.product));
app.use('/api/orders',     authenticate, forward(SERVICES.order));
app.use('/api/cart',         authenticate, forward(SERVICES.cart));
app.use('/api/payments',     authenticate, forward(SERVICES.payment));
app.use('/api/shipping',     authenticate, forward(SERVICES.shipping));
app.use('/api/notifications',authenticate, forward(SERVICES.notification));

if (require.main === module) {
    app.listen(3000, () => {
        console.log('API Gateway running on :3000');
        console.log('Services:', SERVICES);
    });
}

module.exports = app;
