const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  artist_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    required: true
  },
  medium: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image_url: {
    type: String,
    required: true
  },
  imageHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  perceptualHash: {
    type: String,
    index: true
  },
  tags: [String],
  size: {
    type: String,
    enum: ['small', 'medium', 'large']
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'sold'],
    default: 'pending'
  },
  /** When true, artwork is seed/demo data and is hidden from public listing (only artist-uploaded show). */
  is_demo: {
    type: Boolean,
    default: false
  },
  likes_count: {
    type: Number,
    default: 0
  },
  views_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient duplicate detection
artworkSchema.index({ imageHash: 1 }, { unique: true });
artworkSchema.index({ perceptualHash: 1 });
artworkSchema.index({ artist_id: 1, created_at: -1 });

// Expose id for API consumers (same as _id)
artworkSchema.virtual('id').get(function () {
  return this._id?.toString();
});
artworkSchema.set('toJSON', { virtuals: true });
artworkSchema.set('toObject', { virtuals: true });

// Update timestamp on save
artworkSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Artwork', artworkSchema);
