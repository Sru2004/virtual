/**
 * One-time: mark all seed artworks (imageHash starting with "seed-") as is_demo so
 * only artist-uploaded artworks show on the page. Run from backend: node mark-seed-as-demo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Artwork = require('./models/Artwork');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visualart';

async function run() {
  await mongoose.connect(mongoUri);
  const result = await Artwork.updateMany(
    { imageHash: new RegExp('^seed-') },
    { $set: { is_demo: true } }
  );
  console.log('Marked', result.modifiedCount, 'seed artwork(s) as demo. Only artist-added artworks will show on the page.');
  await mongoose.disconnect();
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
