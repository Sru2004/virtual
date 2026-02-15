const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult, matchedData } = require('express-validator');
const User = require('../models/User');
const ArtistProfile = require('../models/ArtistProfile');
const { auth } = require('../middleware/auth');

const findByEmailCaseInsensitive = (email) => {
  const escaped = String(email || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return User.findOne({ email: new RegExp(`^${escaped}$`, 'i') });
};

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty(),
  body('user_type').isIn(['artist', 'user', 'admin'])
], async (req, res) => {
  const dbName = mongoose.connection.db?.databaseName || 'unknown';
  const isConnected = mongoose.connection.readyState === 1;
  console.log(`[Auth] Register: email=${req.body?.email || ''}, DB connected=${isConnected}, database=${dbName}`);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, user_type, phone, profile_picture, address, artist_name, bio, portfolio_link } = req.body;
    const emailLower = (email || '').toLowerCase().trim();

    // Check if user already exists (case-insensitive)
    const existingUser = await findByEmailCaseInsensitive(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (store email lowercase for consistent lookup)
    const user = new User({
      email: emailLower,
      password: hashedPassword,
      full_name,
      user_type,
      phone,
      profile_picture,
      address
    });

    await user.save();
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    console.log(`[Auth] User saved to database "${dbName}", collection "users", id: ${user._id}`);

    // Create artist profile if user_type is artist
    if (user_type === 'artist' && artist_name && bio) {
      const artistProfile = new ArtistProfile({
        user_id: user._id,
        artist_name,
        bio,
        portfolio_link
      });
      await artistProfile.save();
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user._id, email: user.email, full_name, user_type } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login (artist and user share same endpoint)
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = matchedData(req);

    const user = await findByEmailCaseInsensitive(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const passwordTrimmed = (password || '').trim();
    const isMatch = await bcrypt.compare(passwordTrimmed, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

    res.json({ success: true, token, user: { id: user._id, email: user.email, full_name: user.full_name, user_type: user.user_type } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Convert _id to id for consistency
    res.json({
      id: user._id,
      ...user.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Convert _id to id for consistency
    res.json({
      id: user._id,
      ...user.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
