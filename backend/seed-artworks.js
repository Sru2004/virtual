/**
 * Seed script: adds sample published artworks if the database has none.
 * Run from backend folder: node seed-artworks.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Artwork = require('./models/Artwork');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visualart';

const SAMPLE_ARTWORKS = [
  {
    title: 'Sunset Over the Valley',
    description: 'A vibrant landscape capturing the golden hour over rolling hills.',
    category: 'Landscape',
    medium: 'Oil on canvas',
    price: 12500,
    image_url: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg',
    size: 'medium',
  },
  {
    title: 'Abstract Flow',
    description: 'Contemporary abstract piece exploring color and movement.',
    category: 'Abstract',
    medium: 'Acrylic',
    price: 8500,
    image_url: 'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg',
    size: 'large',
  },
  {
    title: 'Portrait in Blue',
    description: 'Expressive portrait with a focus on light and shadow.',
    category: 'Portrait',
    medium: 'Charcoal and pastel',
    price: 6200,
    image_url: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg',
    size: 'small',
  },
  {
    title: 'Urban Nights',
    description: 'Cityscape at night with neon lights and reflections.',
    category: 'Contemporary',
    medium: 'Digital art',
    price: 9900,
    image_url: 'https://images.pexels.com/photos/1482803/pexels-photo-1482803.jpeg',
    size: 'medium',
  },
];

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const publishedCount = await Artwork.countDocuments({ status: 'published', is_demo: { $ne: true } });
    if (publishedCount > 0) {
      console.log(`Already ${publishedCount} published artist artwork(s). No seed needed.`);
      process.exit(0);
      return;
    }

    // Mark any existing seed artworks so they stay hidden from public listing
    await Artwork.updateMany(
      { imageHash: /^seed-/ },
      { $set: { is_demo: true } }
    ).then((r) => r.modifiedCount > 0 && console.log('Marked existing seed artworks as demo.'));

    let artist = await User.findOne({});
    if (!artist) {
      const hashedPassword = await bcrypt.hash('Demo123!', 10);
      artist = await User.create({
        user_type: 'artist',
        full_name: 'Demo Artist',
        email: 'demo@visualart.com',
        password: hashedPassword,
      });
      console.log('Created demo user:', artist.email);
    } else {
      console.log('Using existing user as artist:', artist.email);
    }

    for (let i = 0; i < SAMPLE_ARTWORKS.length; i++) {
      const sample = SAMPLE_ARTWORKS[i];
      const imageHash = `seed-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
      const perceptualHash = `p-${imageHash}`;
      await Artwork.create({
        artist_id: artist._id,
        title: sample.title,
        description: sample.description,
        category: sample.category,
        medium: sample.medium,
        price: sample.price,
        image_url: sample.image_url,
        imageHash,
        perceptualHash,
        size: sample.size,
        status: 'published',
        is_demo: true,
      });
      console.log('Created:', sample.title);
    }

    console.log('Seed complete. Refresh the artworks page.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
