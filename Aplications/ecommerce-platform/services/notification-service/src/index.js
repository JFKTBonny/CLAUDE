const express = require('express');
const mysql   = require('mysql2/promise');
const jwt     = require('jsonwebtoken');

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
    console.log('Notification service connected to DB');
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

const TYPES = ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED',
               'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'WELCOME', 'CUSTOM'];

// Simulate sending notification
const sendNotification = async (type, recipient, data) => {
    console.log(`[NOTIFICATION] ${type} → ${recipient}:`, data);
    // In real world: integrate with SendGrid, Twilio, Firebase, etc.
    return {
        delivered: true,
        channel:   'email',
        recipient,
        timestamp: new Date().toISOString()
    };
};

app.get('/health', (_, res) => res.json({
    status:  'UP',
    service: 'notification-service',
    version: process.env.APP_VERSION || '1.0.0'
}));

// POST /api/notifications — send notification
app.post('/api/notifications', authenticate, async (req, res) => {
    try {
        const { type, recipient, subject, message, data = {} } = req.body;

        if (!type || !recipient || !message) {
            return res.status(400).json({ error: 'type, recipient and message are required' });
        }

        if (!TYPES.includes(type)) {
            return res.status(400).json({ error: 'Invalid type', valid: TYPES });
        }

        const result = await sendNotification(type, recipient, { subject, message, ...data });

        await db.query(
            `INSERT INTO notifications (type, recipient, subject, message, status)
             VALUES (?, ?, ?, ?, ?)`,
            [type, recipient, subject || type, message, result.delivered ? 'SENT' : 'FAILED']
        );

        res.status(201).json({
            message:   'Notification sent',
            type,
            recipient,
            ...result
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notifications — list notifications
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const { recipient, type } = req.query;
        let query = 'SELECT * FROM notifications WHERE 1=1';
        const args = [];

        if (recipient) { query += ' AND recipient = ?'; args.push(recipient); }
        if (type)      { query += ' AND type = ?';      args.push(type); }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const [rows] = await db.query(query, args);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/notifications/bulk — send to multiple recipients
app.post('/api/notifications/bulk', authenticate, async (req, res) => {
    try {
        const { type, recipients, subject, message } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: 'recipients array is required' });
        }

        const results = await Promise.all(
            recipients.map(async recipient => {
                const result = await sendNotification(type, recipient, { subject, message });
                await db.query(
                    `INSERT INTO notifications (type, recipient, subject, message, status)
                     VALUES (?, ?, ?, ?, ?)`,
                    [type, recipient, subject || type, message, result.delivered ? 'SENT' : 'FAILED']
                );
                return { recipient, ...result };
            })
        );

        res.status(201).json({
            message: `Sent ${results.length} notifications`,
            results
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

connectDB().then(() => {
    app.listen(8088, () => console.log('Notification service running on :8088'));
}).catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
});

module.exports = app;
