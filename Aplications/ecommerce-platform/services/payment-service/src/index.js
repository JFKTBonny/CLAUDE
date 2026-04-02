const express = require('express');
const mysql   = require('mysql2/promise');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app        = express();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

app.use(express.json());

// ── DB ─────────────────────────────────────────────────────────────
let db;
async function connectDB() {
    db = await mysql.createPool({
        host:     process.env.DB_HOST || 'localhost',
        user:     process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'secret',
        database: 'orders_db',
        waitForConnections: true,
        connectionLimit: 10,
    });
    console.log('Payment service connected to DB');
}

// ── Auth ───────────────────────────────────────────────────────────
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

// ── Payment simulation ─────────────────────────────────────────────
const simulatePayment = (amount, method) => {
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    return {
        success,
        transaction_id: uuidv4(),
        amount,
        method,
        status:  success ? 'COMPLETED' : 'FAILED',
        message: success ? 'Payment processed successfully' : 'Payment declined'
    };
};

// ── Health ─────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
    status:  'UP',
    service: 'payment-service',
    version: process.env.APP_VERSION || '1.0.0'
}));

// ── POST /api/payments ─────────────────────────────────────────────
app.post('/api/payments', authenticate, async (req, res) => {
    try {
        const { order_id, amount, method = 'CREDIT_CARD' } = req.body;

        if (!order_id || !amount) {
            return res.status(400).json({ error: 'order_id and amount are required' });
        }

        const validMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER'];
        if (!validMethods.includes(method)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        // Simulate processing delay
        await new Promise(r => setTimeout(r, 500));

        const result = simulatePayment(amount, method);

        // Save payment record
        await db.query(
            `INSERT INTO payments (order_id, transaction_id, amount, method, status)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE status = VALUES(status)`,
            [order_id, result.transaction_id, amount, method, result.status]
        );

        res.status(result.success ? 200 : 402).json({
            order_id,
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/payments/:order_id ────────────────────────────────────
app.get('/api/payments/:order_id', authenticate, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC`,
            [req.params.order_id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'No payment found for this order' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/payments ──────────────────────────────────────────────
app.get('/api/payments', authenticate, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM payments ORDER BY created_at DESC LIMIT 50`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

connectDB().then(() => {
    app.listen(8086, () => console.log('Payment service running on :8086'));
}).catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
});

module.exports = app;
