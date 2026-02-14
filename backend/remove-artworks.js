/**
 * Remove specific artworks by title.
 * Run from backend: node remove-artworks.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Artwork = require('./models/Artwork');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visualart';
const titlesToRemove = ['Abstract Flow', 'Portrait in Blue', 'Urban Nights'];

async function run() {
  await mongoose.connect(mongoUri);
  const result = await Artwork.deleteMany({ title: { $in: titlesToRemove } });
  console.log('Removed', result.deletedCount, 'artwork(s):', titlesToRemove.join(', '));
  await mongoose.disconnect();
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
