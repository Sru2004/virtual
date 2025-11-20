const express = require('express');
const { body, validationResult } = require('express-validator');
const Artwork = require('../models/Artwork');
const ArtistProfile = require('../models/ArtistProfile');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all artworks (published or own)
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, artist_id } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    // If not admin, only show published artworks or own artworks
    if (req.user.user_type !== 'admin') {
      if (artist_id) {
        // If specific artist_id requested, check if it's the user's own
        const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
        const isOwnArtist = req.user._id.toString() === artist_id || (artistProfile && artistProfile._id.toString() === artist_id);

        if (isOwnArtist) {
          // Show own artworks, all statuses - include both user_id and artist_profile_id if exists
          const artistIds = [req.user._id];
          if (artistProfile) artistIds.push(artistProfile._id);
          query.artist_id = { $in: artistIds };
        } else {
          // Show only published artworks of that artist
          query.artist_id = artist_id;
          query.status = 'published';
        }
      } else {
        // No specific artist, show published or own
        const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
        if (artistProfile) {
          query.$or = [
            { status: 'published' },
            { artist_id: artistProfile._id },
            { artist_id: req.user._id }
          ];
        } else {
          query.$or = [
            { status: 'published' },
            { artist_id: req.user._id }
          ];
        }
      }
    } else {
      // Admin can see all
      if (artist_id) {
        query.$or = [
          { artist_id: artist_id },
          { artist_id: req.user._id }
        ];
      }
    }

    console.log('Artwork query:', query);
    const artworks = await Artwork.find(query).populate('artist_id', 'full_name');
    console.log('Found artworks:', artworks.length);
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my artworks (for artist dashboard)
router.get('/my-artworks', auth, async (req, res) => {
  try {
    // Only artists can access their own artworks
    if (req.user.user_type !== 'artist') {
      return res.status(403).json({ message: 'Only artists can access their artworks' });
    }

    const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });

    // Include both user_id and artist_profile_id if exists
    const artistIds = [req.user._id];
    if (artistProfile) artistIds.push(artistProfile._id);

    const query = { artist_id: { $in: artistIds } };

    console.log('My artworks query:', query);
    console.log('User ID:', req.user._id);
    console.log('Artist Profile ID:', artistProfile ? artistProfile._id : 'None');

    const artworks = await Artwork.find(query).populate('artist_id', 'full_name').sort({ created_at: -1 });
    console.log('Found my artworks:', artworks.length);

    // Log each artwork for debugging
    artworks.forEach((artwork, index) => {
      console.log(`${index + 1}. Title: ${artwork.title}, Artist ID: ${artwork.artist_id}`);
    });

    res.json(artworks);
  } catch (error) {
    console.error('Error fetching my artworks:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get artwork by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate('artist_id', 'full_name');
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user can view this artwork
    if (artwork.status !== 'published' && artwork.artist_id.toString() !== req.user._id.toString() && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(artwork);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create artwork
router.post('/', auth, [
  body('title').notEmpty(),
  body('category').notEmpty(),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('image_url').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is an artist
    if (req.user.user_type !== 'artist') {
      return res.status(403).json({ message: 'Only artists can create artworks' });
    }

    const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
    let artistId = artistProfile?._id;

    // If no artist profile exists, use user ID directly
    if (!artistProfile) {
      artistId = req.user._id;
      console.log('Using user ID as artist ID:', artistId);
    } else {
      artistId = artistProfile._id;
    }

    const artwork = new Artwork({
      ...req.body,
      artist_id: artistId
    });

    await artwork.save();

    // Only populate and update count if artist profile exists
    if (artistProfile) {
      await artwork.populate('artist_id', 'full_name');
      // Update artist's artworks_sold count
      await ArtistProfile.findByIdAndUpdate(artistProfile._id, {
        $inc: { artworks_sold: 1 }
      });
    } else {
      // Populate with user full_name if no artist profile
      await artwork.populate('artist_id', 'full_name');
    }

    res.status(201).json(artwork);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update artwork
router.put('/:id', auth, [
  body('title').optional().notEmpty(),
  body('category').optional().notEmpty(),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('image_url').optional().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user can update this artwork
    if (artwork.artist_id.toString() !== req.user._id.toString() && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = req.body;
    updates.updated_at = new Date();

    const updatedArtwork = await Artwork.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('artist_id', 'full_name');
    res.json(updatedArtwork);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete artwork
router.delete('/:id', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user can delete this artwork
    if (artwork.artist_id.toString() !== req.user._id.toString() && req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get the artist profile to decrement artworks_sold count
    const artistProfile = await ArtistProfile.findById(artwork.artist_id);
    if (artistProfile && artistProfile.artworks_sold > 0) {
      await ArtistProfile.findByIdAndUpdate(artwork.artist_id, {
        $inc: { artworks_sold: -1 }
      });
    }

    await Artwork.findByIdAndDelete(req.params.id);
    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload artwork with image
router.post('/upload', auth, require('../middleware/upload').single('image'), async (req, res) => {
  console.log('Upload request received');
  console.log('User:', req.user);
  console.log('Body:', req.body);
  console.log('File:', req.file);

  try {
    // Check if file was uploaded
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Simple validation
    if (!req.body.title || !req.body.category || !req.body.price) {
      console.log('Validation failed: missing fields');
      return res.status(400).json({ message: 'Missing required fields: title, category, price' });
    }

    // Check if user is an artist
    if (req.user.user_type !== 'artist') {
      console.log('User is not an artist');
      return res.status(403).json({ message: 'Only artists can upload artworks' });
    }

    const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
    console.log('Artist profile found:', artistProfile);

    // Allow upload even if artist profile doesn't exist yet
    // This handles the case where a new artist registers and tries to upload immediately
    let artistId;

    // If no artist profile exists, create a temporary one or use user ID directly
    if (!artistProfile) {
      console.log('No artist profile found, creating temporary reference');
      // For now, we'll use the user ID as artist_id, but ideally should create artist profile
      artistId = req.user._id;
      console.log('Using user ID as artist ID:', artistId);
    } else {
      artistId = artistProfile._id;
    }

    // Construct image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const artwork = new Artwork({
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category,
      price: parseFloat(req.body.price),
      image_url: imageUrl,
      artist_id: artistId,
      status: 'published'
    });

    console.log('Saving artwork:', artwork);
    await artwork.save();

    // Only populate and update count if artist profile exists
    if (artistProfile) {
      await artwork.populate('artist_id', 'full_name');
      // Update artist's artworks_sold count
      await ArtistProfile.findByIdAndUpdate(artistProfile._id, {
        $inc: { artworks_sold: 1 }
      });
    } else {
      // Populate with user full_name if no artist profile
      await artwork.populate('artist_id', 'full_name');
    }

    console.log('Artwork saved successfully');
    res.status(201).json({
      message: 'Artwork uploaded successfully! 🎨',
      artwork: artwork
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload artwork. Please try again.' });
  }
});

module.exports = router;
