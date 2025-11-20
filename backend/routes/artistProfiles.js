const express = require('express');
const { body, validationResult } = require('express-validator');
const ArtistProfile = require('../models/ArtistProfile');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all artist profiles
router.get('/', auth, async (req, res) => {
  try {
    const artistProfiles = await ArtistProfile.find().populate('user_id', 'full_name email');
    res.json(artistProfiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create artist profile
router.post('/', auth, [
  body('artist_name').notEmpty(),
  body('bio').isLength({ min: 200, max: 300 }),
  body('portfolio_link').optional(),
  body('art_style').optional(),
  body('location').optional(),
  body('social_links').optional(),
  body('years_experience').optional().isInt({ min: 0 }),
  body('exhibitions').optional().isInt({ min: 0 }),
  body('awards_won').optional().isInt({ min: 0 }),
  body('artworks_sold').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is an artist
    if (req.user.user_type !== 'artist') {
      return res.status(403).json({ message: 'Only artists can create artist profiles' });
    }

    // Check if artist profile already exists
    const existingProfile = await ArtistProfile.findOne({ user_id: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Artist profile already exists' });
    }

    const artistProfile = new ArtistProfile({
      user_id: req.user._id,
      ...req.body
    });

    await artistProfile.save();
    await artistProfile.populate('user_id', 'full_name email');

    res.status(201).json(artistProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get artist profile by user ID
router.get('/:id', auth, async (req, res) => {
  try {
    const artistProfile = await ArtistProfile.findOne({ user_id: req.params.id }).populate('user_id', 'full_name email');
    if (!artistProfile) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }
    res.json(artistProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update artist profile
router.put('/:id', auth, [
  body('artist_name').optional().notEmpty(),
  body('bio').optional().isLength({ min: 200, max: 300 }),
  body('portfolio_link').optional(),
  body('art_style').optional(),
  body('location').optional(),
  body('social_links').optional(),
  body('years_experience').optional().isInt({ min: 0 }),
  body('exhibitions').optional().isInt({ min: 0 }),
  body('awards_won').optional().isInt({ min: 0 }),
  body('artworks_sold').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user can update this artist profile
    if (req.user._id.toString() !== req.params.id && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = req.body;
    const artistProfile = await ArtistProfile.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('user_id', 'full_name email');
    if (!artistProfile) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    res.json(artistProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete artist profile
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admin can delete artist profiles
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const artistProfile = await ArtistProfile.findByIdAndDelete(req.params.id);
    if (!artistProfile) {
      return res.status(404).json({ message: 'Artist profile not found' });
    }

    res.json({ message: 'Artist profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
