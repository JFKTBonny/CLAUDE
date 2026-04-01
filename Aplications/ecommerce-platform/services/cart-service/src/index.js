const express = require('express');
const mysql   = require('mysql2/promise');
const jwt     = require('jsonwebtoken');
const axios   = require('axios');

const app        = express();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://product-service:8082';

app.use(express.json());

// ── Database connection ────────────────────────────────────────────
let db;
async function connectDB() {
    db = await mysql.createPool({
        host:     process.env.DB_HOST     || 'localhost',
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASS     || 'secret',
        database: 'cart_db',
        waitForConnections: true,
        connectionLimit:    10,
    });
    console.log('Connected to MySQL cart_db');
}

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

// ── Health ─────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
    status:  'UP',
    service: 'cart-service',
    version: process.env.APP_VERSION || '1.0.0'
}));

// ── GET /api/cart ──────────────────────────────────────────────────
app.get('/api/cart', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [items] = await db.query(
            `SELECT id, user_id, product_id, quantity, created_at, updated_at
             FROM cart_items WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        // Calculate total
        let total = 0;
        const enrichedItems = await Promise.all(items.map(async (item) => {
            try {
                const resp = await axios.get(
                    `${PRODUCT_SERVICE}/api/products/${item.product_id}`,
                    { headers: { Authorization: req.headers['authorization'] } }
                );
                const product = resp.data;
                const subtotal = product.price * item.quantity;
                total += subtotal;
                return { ...item, product, subtotal };
            } catch {
                return { ...item, product: null, subtotal: 0 };
            }
        }));

        res.json({
            user_id: userId,
            items:   enrichedItems,
            total:   Math.round(total * 100) / 100,
            count:   items.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/cart ─────────────────────────────────────────────────
app.post('/api/cart', authenticate, async (req, res) => {
    try {
        const userId     = req.user.userId;
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }
        if (quantity < 1) {
            return res.status(400).json({ error: 'quantity must be at least 1' });
        }

        // Verify product exists and has stock
        try {
            const resp = await axios.get(
                `${PRODUCT_SERVICE}/api/products/${product_id}`,
                { headers: { Authorization: req.headers['authorization'] } }
            );
            const product = resp.data;
            if (product.stock < quantity) {
                return res.status(400).json({
                    error: `Insufficient stock. Available: ${product.stock}`
                });
            }
        } catch {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Upsert cart item
        await db.query(
            `INSERT INTO cart_items (user_id, product_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             quantity = quantity + VALUES(quantity),
             updated_at = CURRENT_TIMESTAMP`,
            [userId, product_id, quantity]
        );

        const [[item]] = await db.query(
            `SELECT * FROM cart_items
             WHERE user_id = ? AND product_id = ?`,
            [userId, product_id]
        );

        res.status(201).json({ message: 'Item added to cart', item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/cart/:product_id ────────────────────────────────────
app.patch('/api/cart/:product_id', authenticate, async (req, res) => {
    try {
        const userId     = req.user.userId;
        const productId  = parseInt(req.params.product_id);
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ error: 'quantity must be at least 1' });
        }

        const [result] = await db.query(
            `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ? AND product_id = ?`,
            [quantity, userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Cart updated', product_id: productId, quantity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/cart/:product_id ───────────────────────────────────
app.delete('/api/cart/:product_id', authenticate, async (req, res) => {
    try {
        const userId    = req.user.userId;
        const productId = parseInt(req.params.product_id);

        const [result] = await db.query(
            `DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/cart ───────────────────────────────────────────────
app.delete('/api/cart', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        await db.query(
            `DELETE FROM cart_items WHERE user_id = ?`, [userId]
        );
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/cart/checkout ────────────────────────────────────────
app.post('/api/cart/checkout', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { notes = '' } = req.body;

        // Get cart items
        const [cartItems] = await db.query(
            `SELECT * FROM cart_items WHERE user_id = ?`, [userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Build order items with prices from product service
        const orderItems = [];
        let total = 0;

        for (const item of cartItems) {
            const resp = await axios.get(
                `${PRODUCT_SERVICE}/api/products/${item.product_id}`,
                { headers: { Authorization: req.headers['authorization'] } }
            );
            const product = resp.data;

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const subtotal = product.price * item.quantity;
            total += subtotal;
            orderItems.push({
                product_id: item.product_id,
                quantity:   item.quantity,
                unit_price: product.price
            });
        }

        // Create order via order-service
        const orderResp = await axios.post(
            `${process.env.ORDER_SERVICE_URL || 'http://order-service:8083'}/api/orders`,
            { user_id: userId, notes, items: orderItems },
            { headers: { Authorization: req.headers['authorization'] } }
        );

        // Clear cart after successful order
        await db.query(
            `DELETE FROM cart_items WHERE user_id = ?`, [userId]
        );

        res.status(201).json({
            message: 'Order placed successfully',
            order:   orderResp.data
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Start ──────────────────────────────────────────────────────────
connectDB().then(() => {
    app.listen(8085, () => {
        console.log('Cart service running on :8085');
    });
}).catch(err => {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
});

module.exports = app;
