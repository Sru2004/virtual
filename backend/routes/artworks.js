const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const http = require('http');
const https = require('https');
const path = require('path');
const Artwork = require('../models/Artwork');
const ArtistProfile = require('../models/ArtistProfile');
const { auth, optionalAuth } = require('../middleware/auth');
const { generateNormalizedSHA256Hash, generatePerceptualHash, areSimilarImages } = require('../utils/imageHash');

const router = express.Router();

const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES || 5242880);
const MAX_IMAGE_REDIRECTS = 3;

const downloadImageBuffer = (imageUrl, redirectCount = 0) => new Promise((resolve, reject) => {
  try {
    const url = new URL(imageUrl);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(url, (res) => {
      const statusCode = res.statusCode || 0;

      if (statusCode >= 300 && statusCode < 400 && res.headers.location && redirectCount < MAX_IMAGE_REDIRECTS) {
        res.resume();
        resolve(downloadImageBuffer(res.headers.location, redirectCount + 1));
        return;
      }

      if (statusCode < 200 || statusCode >= 300) {
        res.resume();
        reject(new Error('Failed to download image'));
        return;
      }

      const chunks = [];
      let size = 0;

      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_IMAGE_BYTES) {
          req.destroy(new Error('Image too large'));
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error('Image download timeout'));
    });
  } catch (error) {
    reject(error);
  }
});

// Get all artworks (public: published only; authenticated: published + own, admin: all)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, category, artist_id } = req.query;
    let query = {};

    // No token or invalid token: only published artworks (public gallery); exclude seed/demo
    if (!req.user) {
      query.status = 'published';
      query.is_demo = { $ne: true };
      if (category) query.category = category;
      if (artist_id) query.artist_id = artist_id;
      const artworks = await Artwork.find(query).populate('artist_id', 'full_name');
      return res.json(artworks);
    }

    if (status) query.status = status;
    if (category) query.category = category;
    // Only show artist-uploaded artworks (exclude seed/demo)
    query.is_demo = { $ne: true };

    // If not admin, only show published artworks or own artworks
    if (req.user.user_type !== 'admin') {
      if (artist_id) {
        const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
        const isOwnArtist = req.user._id.toString() === artist_id || (artistProfile && artistProfile._id.toString() === artist_id);

        if (isOwnArtist) {
          const artistIds = [req.user._id];
          if (artistProfile) artistIds.push(artistProfile._id);
          query.artist_id = { $in: artistIds };
        } else {
          query.artist_id = artist_id;
          query.status = 'published';
        }
      } else {
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
      if (artist_id) {
        query.$or = [
          { artist_id: artist_id },
          { artist_id: req.user._id }
        ];
      }
    }

    const artworks = await Artwork.find(query).populate('artist_id', 'full_name');
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my artworks (for artist dashboard)
router.get('/my-artworks', auth, async (req, res) => {
  try {
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

// Get artwork by ID (optional auth: published artworks viewable by anyone)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate('artist_id', 'full_name');
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Skip demo/seed artworks from public
    if (artwork.is_demo) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user can view this artwork
    let canView = false;
    if (artwork.status === 'published') {
      canView = true;
    } else if (req.user && req.user.user_type === 'admin') {
      canView = true;
    } else if (req.user) {
      // Check if logged-in user is the artist
      const artistId = artwork.artist_id?._id || artwork.artist_id;
      const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
      const userArtistIds = [req.user._id];
      if (artistProfile) userArtistIds.push(artistProfile._id);
      if (artistId && userArtistIds.some(id => id.toString() === artistId.toString())) {
        canView = true;
      }
    }

    if (!canView) {
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

    const imageUrl = req.body.image_url;
    const fileBuffer = await downloadImageBuffer(imageUrl);

    const imageHash = await generateNormalizedSHA256Hash(fileBuffer);
    console.log('Generated SHA-256 hash:', imageHash);

    const perceptualHash = await generatePerceptualHash(fileBuffer);
    console.log('Generated perceptual hash:', perceptualHash || 'N/A');

    const exactDuplicate = await Artwork.findOne({ imageHash }).select('_id artist_id');
    if (exactDuplicate) {
      return res.status(409).json({
        success: false,
        errorType: 'DUPLICATE_IMAGE',
        message: 'Duplicate or visually similar image detected'
      });
    }

    if (perceptualHash) {
      const similarityThreshold = Number(process.env.IMAGE_SIMILARITY_THRESHOLD || 8);
      const allArtworks = await Artwork.find({ perceptualHash: { $exists: true, $ne: null } })
        .select('perceptualHash artist_id')
        .limit(2000);

      for (const artwork of allArtworks) {
        if (areSimilarImages(perceptualHash, artwork.perceptualHash, similarityThreshold)) {
          const isDifferentArtist = artwork.artist_id?.toString() !== artistId?.toString();
          return res.status(409).json({
            success: false,
            errorType: 'DUPLICATE_IMAGE',
            message: isDifferentArtist
              ? 'This image already exists on the platform'
              : 'Duplicate or visually similar image detected'
          });
        }
      }
    }

    const artwork = new Artwork({
      ...req.body,
      artist_id: artistId,
      imageHash,
      perceptualHash,
      is_demo: false
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
    if (error.code === 11000 && (error.keyPattern?.imageHash || error.keyValue?.imageHash)) {
      return res.status(409).json({
        success: false,
        errorType: 'DUPLICATE_IMAGE',
        message: 'Duplicate or visually similar image detected'
      });
    }

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
    let canUpdate = false;
    if (req.user.user_type === 'admin') {
      canUpdate = true;
    } else {
      // Check if user is the artist
      const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
      const userArtistIds = [req.user._id];
      if (artistProfile) userArtistIds.push(artistProfile._id);
      if (userArtistIds.some(id => id.toString() === artwork.artist_id.toString())) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
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
    console.log('Delete request for artwork:', req.params.id);
    console.log('User:', req.user._id, req.user.user_type);

    const artwork = await Artwork.findById(req.params.id).populate('artist_id');
    if (!artwork) {
      console.log('Artwork not found');
      return res.status(404).json({ message: 'Artwork not found' });
    }

    console.log('Artwork artist_id:', artwork.artist_id);

    // Check if user can delete this artwork
    let canDelete = false;
    if (req.user.user_type === 'admin') {
      canDelete = true;
      console.log('User is admin, can delete');
    } else if (artwork.artist_id) {
      // Check if user is the artist
      const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
      console.log('Artist profile found:', artistProfile ? artistProfile._id : 'None');

      const userArtistIds = [req.user._id];
      if (artistProfile) userArtistIds.push(artistProfile._id);

      console.log('userArtistIds:', userArtistIds.map(id => id.toString()));
      console.log('artwork.artist_id:', artwork.artist_id);

      // Safely handle both populated and non-populated artist_id
      const artworkArtistId = artwork.artist_id && artwork.artist_id._id 
        ? artwork.artist_id._id.toString() 
        : artwork.artist_id ? artwork.artist_id.toString() : null;

      if (artworkArtistId && userArtistIds.some(id => id.toString() === artworkArtistId)) {
        canDelete = true;
        console.log('User is the artist, can delete');
      } else {
        console.log('User is not the artist, cannot delete');
      }
    } else {
      console.log('Artwork has no artist_id, checking if orphaned artwork');
      // If artwork has no artist_id, allow deletion for authenticated users (orphaned artwork)
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get the artist profile to decrement artworks_sold count (only if artist_id exists)
    if (artwork.artist_id) {
      const artistIdToUse = artwork.artist_id._id ? artwork.artist_id._id : artwork.artist_id;
      const artistProfile = await ArtistProfile.findById(artistIdToUse);
      if (artistProfile && artistProfile.artworks_sold > 0) {
        await ArtistProfile.findByIdAndUpdate(artistIdToUse, {
          $inc: { artworks_sold: -1 }
        });
      }
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

  let uploadedFilePath = null;

  try {
    // Check if file was uploaded
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ 
        success: false,
        message: 'No image file provided' 
      });
    }

    uploadedFilePath = req.file.path;

    // Simple validation
    if (!req.body.title || !req.body.category || !req.body.price) {
      console.log('Validation failed: missing fields');
      // Clean up uploaded file
      await fs.unlink(uploadedFilePath).catch(err => console.error('Error deleting file:', err));
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: title, category, price' 
      });
    }

    // Check if user is an artist
    if (req.user.user_type !== 'artist') {
      console.log('User is not an artist');
      // Clean up uploaded file
      await fs.unlink(uploadedFilePath).catch(err => console.error('Error deleting file:', err));
      return res.status(403).json({ 
        success: false,
        message: 'Only artists can upload artworks' 
      });
    }

    // === DUPLICATE DETECTION ===
    console.log('Starting duplicate detection...');
    
    // Read file buffer for hashing (buffer preferred if using memory storage)
    const fileBuffer = req.file.buffer ? req.file.buffer : await fs.readFile(uploadedFilePath);
    
    // Generate normalized SHA-256 hash for exact duplicate detection across formats
    const imageHash = await generateNormalizedSHA256Hash(fileBuffer);
    console.log('Generated SHA-256 hash:', imageHash);
    
    // Generate perceptual hash for similar image detection
    const perceptualHash = await generatePerceptualHash(fileBuffer);
    console.log('Generated perceptual hash:', perceptualHash || 'N/A');

    const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
    console.log('Artist profile found:', artistProfile);

    let artistId;
    if (artistProfile) {
      artistId = artistProfile._id;
    } else {
      // Allow upload even if artist profile doesn't exist yet
      console.log('No artist profile found, using user ID as artist ID');
      artistId = req.user._id;
    }

    // Check for exact duplicate by SHA-256 hash
    const exactDuplicate = await Artwork.findOne({ imageHash }).select('_id title created_at artist_id');
    if (exactDuplicate) {
      console.log('Exact duplicate detected:', exactDuplicate._id, 'hash:', imageHash);
      // Clean up uploaded file
      await fs.unlink(uploadedFilePath).catch(err => console.error('Error deleting file:', err));
      
      return res.status(409).json({
        success: false,
        errorType: 'DUPLICATE_IMAGE',
        message: 'Duplicate or visually similar image detected'
      });
    }

    // Check for similar images using perceptual hash (if available)
    if (perceptualHash) {
      const similarityThreshold = Number(process.env.IMAGE_SIMILARITY_THRESHOLD || 8);
      const allArtworks = await Artwork.find({ perceptualHash: { $exists: true, $ne: null } })
        .select('perceptualHash artist_id')
        .limit(2000);

      for (const artwork of allArtworks) {
        if (areSimilarImages(perceptualHash, artwork.perceptualHash, similarityThreshold)) {
          const isDifferentArtist = artwork.artist_id?.toString() !== artistId?.toString();
          console.log('Similar image detected:', artwork._id, 'differentArtist:', isDifferentArtist);
          await fs.unlink(uploadedFilePath).catch(err => console.error('Error deleting file:', err));

          return res.status(409).json({
            success: false,
            errorType: 'DUPLICATE_IMAGE',
            message: isDifferentArtist
              ? 'This image already exists on the platform'
              : 'Duplicate or visually similar image detected'
          });
        }
      }
    }

    console.log('No duplicates found, proceeding with upload...');

    // === PROCEED WITH ARTWORK CREATION ===
    // Construct image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const artwork = new Artwork({
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category,
      price: parseFloat(req.body.price),
      image_url: imageUrl,
      imageHash: imageHash,
      perceptualHash: perceptualHash,
      artist_id: artistId,
      status: 'published',
      is_demo: false
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
      success: true,
      message: 'Artwork uploaded successfully! 🎨',
      artwork: artwork
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (uploadedFilePath) {
      await fs.unlink(uploadedFilePath).catch(err => 
        console.error('Error deleting file during cleanup:', err)
      );
    }

    // Handle specific MongoDB duplicate key error
    if (error.code === 11000 && (error.keyPattern?.imageHash || error.keyValue?.imageHash)) {
      return res.status(409).json({
        success: false,
        errorType: 'DUPLICATE_IMAGE',
        message: 'Duplicate or visually similar image detected'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to upload artwork. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
