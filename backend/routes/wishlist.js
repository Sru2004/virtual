const express = require('express');
const { body, validationResult } = require('express-validator');
const Wishlist = require('../models/Wishlist');
const Artwork = require('../models/Artwork');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's wishlist
router.get('/', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user_id: req.user._id })
      .populate('artwork_id', 'title price image_url category artist_id')
      .populate('artwork_id.artist_id', 'artist_name');
    console.log('Wishlist data from backend:', wishlist);
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to wishlist
router.post('/', auth, [
  body('artwork_id').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { artwork_id } = req.body;

    // Check if artwork exists and is published
    const artwork = await Artwork.findById(artwork_id);
    if (!artwork || artwork.status !== 'published') {
      return res.status(400).json({ message: 'Artwork not available' });
    }

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({
      user_id: req.user._id,
      artwork_id
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Artwork already in wishlist' });
    }

    const wishlistItem = new Wishlist({
      user_id: req.user._id,
      artwork_id
    });

    await wishlistItem.save();
    await wishlistItem.populate('artwork_id', 'title price image_url artist_id');
    await wishlistItem.populate('artwork_id.artist_id', 'artist_name');

    res.status(201).json(wishlistItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove from wishlist
router.delete('/:artworkId', auth, async (req, res) => {
  try {
    const wishlistItem = await Wishlist.findOneAndDelete({
      user_id: req.user._id,
      artwork_id: req.params.artworkId
    });

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if artwork is in wishlist
router.get('/check/:artworkId', auth, async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      user_id: req.user._id,
      artwork_id: req.params.artworkId
    });

    res.json({ inWishlist: !!item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
