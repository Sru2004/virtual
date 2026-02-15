const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all profiles (public)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profile by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to convert empty strings to undefined for optional fields
const sanitizeOptionalFields = (req, res, next) => {
  const optionalFields = ['full_name', 'phone', 'profile_picture', 'address', 'gender', 'dateOfBirth', 'city', 'state', 'country'];
  
  optionalFields.forEach(field => {
    if (req.body[field] === '') {
      req.body[field] = undefined;
    }
  });
  
  next();
};

// Update profile
router.put('/:id', auth, sanitizeOptionalFields, [
  body('full_name').optional().notEmpty(),
  body('phone').optional(),
  body('profile_picture').optional(),
  body('address').optional(),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
  body('city').optional(),
  body('state').optional(),
  body('country').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstMsg = errors.array()[0]?.msg || 'Validation failed';
      return res.status(400).json({ message: firstMsg, errors: errors.array() });
    }

    // Check if user can update this profile (compare as strings; id from URL is string)
    const requestedId = String(req.params.id).trim();
    if (!requestedId) {
      return res.status(400).json({ message: 'Profile ID is required' });
    }
    if (req.user._id.toString() !== requestedId && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = { ...req.body };
    updates.updated_at = new Date();
    // Only include defined fields so we don't overwrite required fields with undefined
    Object.keys(updates).forEach((k) => {
      if (updates[k] === undefined || updates[k] === '') delete updates[k];
    });
    if (updates.full_name !== undefined && String(updates.full_name).trim() === '') {
      delete updates.full_name; // keep existing name if user cleared it
    }

    const user = await User.findByIdAndUpdate(requestedId, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete profile
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admin can delete profiles
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
