const express = require('express');
const mysql   = require('mysql2/promise');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app        = express();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

app.use(express.json());

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
    console.log('Shipping service connected to DB');
}

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

const CARRIERS = ['DHL', 'FedEx', 'UPS', 'USPS'];
const STATUSES = ['PROCESSING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

app.get('/health', (_, res) => res.json({
    status:  'UP',
    service: 'shipping-service',
    version: process.env.APP_VERSION || '1.0.0'
}));

// POST /api/shipping — create shipment
app.post('/api/shipping', authenticate, async (req, res) => {
    try {
        const { order_id, address, city, country, postal_code } = req.body;

        if (!order_id || !address) {
            return res.status(400).json({ error: 'order_id and address are required' });
        }

        const tracking_number = `TRK-${uuidv4().substring(0,8).toUpperCase()}`;
        const carrier         = CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
        const estimated_days  = Math.floor(Math.random() * 5) + 3;
        const estimated_date  = new Date(Date.now() + estimated_days * 86400000)
                                    .toISOString().split('T')[0];

        await db.query(
            `INSERT INTO shipments
             (order_id, tracking_number, carrier, status, address, city, country, postal_code, estimated_delivery)
             VALUES (?, ?, ?, 'PROCESSING', ?, ?, ?, ?, ?)`,
            [order_id, tracking_number, carrier, address, city, country, postal_code, estimated_date]
        );

        res.status(201).json({
            order_id,
            tracking_number,
            carrier,
            status:            'PROCESSING',
            estimated_delivery: estimated_date,
            address:           { address, city, country, postal_code },
            message:           'Shipment created successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/shipping/:tracking_number — track shipment
app.get('/api/shipping/:tracking_number', authenticate, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM shipments WHERE tracking_number = ?`,
            [req.params.tracking_number]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/shipping/order/:order_id
app.get('/api/shipping/order/:order_id', authenticate, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM shipments WHERE order_id = ? ORDER BY created_at DESC`,
            [req.params.order_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/shipping/:tracking_number/status — update status
app.patch('/api/shipping/:tracking_number/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body;
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Invalid status', valid: STATUSES });
        }

        const [result] = await db.query(
            `UPDATE shipments SET status = ?, updated_at = NOW()
             WHERE tracking_number = ?`,
            [status, req.params.tracking_number]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        res.json({ tracking_number: req.params.tracking_number, status, message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

connectDB().then(() => {
    app.listen(8087, () => console.log('Shipping service running on :8087'));
}).catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
});

module.exports = app;
