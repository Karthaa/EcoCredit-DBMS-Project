const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'EcoCredit API is running!' });
});

// ========== USER ROUTES ==========

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );
        if (users.length > 0) {
            res.json({ success: true, user: users[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        await db.query(
            'INSERT INTO users (username, password, credits, is_admin) VALUES (?, ?, 0, FALSE)',
            [username, password]
        );
        const [newUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        res.json({ success: true, user: newUser[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get User by ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== SUBMISSION ROUTES ==========

// Get all submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const [submissions] = await db.query('SELECT * FROM submissions ORDER BY created_at DESC');
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get submissions by user
app.get('/api/submissions/user/:userId', async (req, res) => {
    try {
        const [submissions] = await db.query(
            'SELECT * FROM submissions WHERE user_id = ? ORDER BY created_at DESC',
            [req.params.userId]
        );
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create submission
app.post('/api/submissions', async (req, res) => {
    const { userId, plasticType, weight, credits, date } = req.body;
    try {
        await db.query(
            'INSERT INTO submissions (user_id, plastic_type, weight, credits, status, submission_date) VALUES (?, ?, ?, ?, "pending", ?)',
            [userId, plasticType, weight, credits, date]
        );
        res.json({ success: true, message: 'Submission created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve submission
app.put('/api/submissions/:id/approve', async (req, res) => {
    try {
        // Get submission details
        const [submission] = await db.query('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
        
        // Update submission status
        await db.query('UPDATE submissions SET status = "approved" WHERE id = ?', [req.params.id]);
        
        // Add credits to user
        await db.query(
            'UPDATE users SET credits = credits + ? WHERE id = ?',
            [submission[0].credits, submission[0].user_id]
        );
        
        res.json({ success: true, message: 'Submission approved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject submission
app.put('/api/submissions/:id/reject', async (req, res) => {
    try {
        await db.query('UPDATE submissions SET status = "rejected" WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Submission rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== REDEMPTION ROUTES ==========

// Create redemption
app.post('/api/redemptions', async (req, res) => {
    const { userId, itemName, creditsSpent, date } = req.body;
    try {
        // Deduct credits from user
        await db.query('UPDATE users SET credits = credits - ? WHERE id = ?', [creditsSpent, userId]);
        
        // Insert redemption
        await db.query(
            'INSERT INTO redemptions (user_id, item_name, credits_spent, redemption_date) VALUES (?, ?, ?, ?)',
            [userId, itemName, creditsSpent, date]
        );
        
        res.json({ success: true, message: 'Redemption successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== STATISTICS ROUTES ==========

// Get admin statistics
app.get('/api/stats', async (req, res) => {
    try {
        const [recycled] = await db.query(
            'SELECT SUM(weight) as total FROM submissions WHERE status = "approved"'
        );
        const [credits] = await db.query(
            'SELECT SUM(credits) as total FROM submissions WHERE status = "approved"'
        );
        const [users] = await db.query(
            'SELECT COUNT(*) as total FROM users WHERE is_admin = FALSE'
        );
        
        res.json({
            totalRecycled: recycled[0].total || 0,
            totalCredits: credits[0].total || 0,
            activeUsers: users[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});