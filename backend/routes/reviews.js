const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Artwork = require('../models/Artwork');
const ArtistProfile = require('../models/ArtistProfile');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all reviews (for artists to see their reviews)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // If artist, only return reviews for their artworks
    if (req.user.user_type === 'artist') {
      const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
      if (artistProfile) {
        query.artist_id = artistProfile._id;
      } else {
        // If no artist profile found, return empty array
        return res.json({ success: true, reviews: [] });
      }
    } else if (req.user.user_type !== 'admin') {
      // Regular users can only see their own reviews
      query.user_id = req.user._id;
    }
    // Admin can see all reviews (no filter)

    const reviews = await Review.find(query)
      .populate('user_id', 'full_name')
      .populate('artwork_id', 'title image_url')
      .populate('artist_id', 'artist_name')
      .sort({ created_at: -1 });
    
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get reviews for an artwork
router.get('/artwork/:artworkId', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ artwork_id: req.params.artworkId })
      .populate('user_id', 'full_name')
      .populate('artist_id', 'artist_name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get review by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user_id', 'full_name')
      .populate('artwork_id', 'title')
      .populate('artist_id', 'artist_name');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create review
router.post('/', auth, [
  body('artwork_id').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { artwork_id, rating, comment } = req.body;

    // Check if artwork exists
    const artwork = await Artwork.findById(artwork_id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user has purchased this artwork
    const hasPurchased = await require('../models/Order').findOne({
      user_id: req.user._id,
      artwork_id,
      status: 'completed'
    });

    if (!hasPurchased && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Can only review purchased artworks' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user_id: req.user._id,
      artwork_id
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this artwork' });
    }

    const review = new Review({
      user_id: req.user._id,
      artwork_id,
      artist_id: artwork.artist_id,
      rating,
      comment
    });

    await review.save();
    await review.populate('user_id', 'full_name');
    await review.populate('artwork_id', 'title');
    await review.populate('artist_id', 'artist_name');

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update review
router.put('/:id', auth, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user can update this review
    if (review.user_id.toString() !== req.user._id.toString() && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedReview = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user_id', 'full_name')
      .populate('artwork_id', 'title')
      .populate('artist_id', 'artist_name');

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user can delete this review
    if (review.user_id.toString() !== req.user._id.toString() && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
