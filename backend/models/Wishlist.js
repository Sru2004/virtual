const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  artwork_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique combination of user_id and artwork_id
wishlistSchema.index({ user_id: 1, artwork_id: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
