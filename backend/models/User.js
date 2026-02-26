const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
