const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /users/sync  →  create or update user on login
router.post('/sync', async (req, res) => {
    try {
        const { clerkId, email, name, imageUrl } = req.body;
        if (!clerkId) return res.status(400).json({ error: 'clerkId is required' });

        const user = await User.findOneAndUpdate(
            { clerkId },
            { clerkId, email, name, imageUrl, lastLogin: new Date() },
            { upsert: true, new: true }
        );

        res.json({
            _id: user._id,
            clerkId: user.clerkId,
            email: user.email,
            name: user.name,
            imageUrl: user.imageUrl,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
