const mongoose = require('mongoose');
const Artwork = require('./models/Artwork');
const ArtistProfile = require('./models/ArtistProfile');

async function checkArtworks() {
  try {
    // Connect using default options (modern driver no longer needs these flags)
    await mongoose.connect('mongodb+srv://truptikandalkar0:Radha3992@cluster0.low5vpa.mongodb.net/?appName=Cluster0', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('Connected to MongoDB');

    // Get all artworks
    const artworks = await Artwork.find({});
    console.log(`\nTotal artworks in database: ${artworks.length}`);

    // Get all artist profiles
    const artistProfiles = await ArtistProfile.find({});
    console.log(`Total artist profiles: ${artistProfiles.length}`);

    // Show details of each artwork
    console.log('\n=== ARTWORKS ===');
    artworks.forEach((artwork, index) => {
      console.log(`${index + 1}. ID: ${artwork._id}`);
      console.log(`   Title: ${artwork.title}`);
      console.log(`   Artist ID: ${artwork.artist_id}`);
      console.log(`   Status: ${artwork.status}`);
      console.log(`   Created: ${artwork.created_at}`);
      console.log('');
    });

    // Show artist profiles
    console.log('=== ARTIST PROFILES ===');
    artistProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile._id}`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Artist Name: ${profile.artist_name}`);
      console.log('');
    });

    // Check if artworks match artist profiles
    console.log('=== ANALYSIS ===');
    artworks.forEach((artwork) => {
      const matchingProfile = artistProfiles.find(profile =>
        profile.user_id.toString() === artwork.artist_id.toString() ||
        profile._id.toString() === artwork.artist_id.toString()
      );

      if (matchingProfile) {
        console.log(`✓ Artwork "${artwork.title}" matches artist profile (User: ${matchingProfile.user_id}, Profile: ${matchingProfile._id})`);
      } else {
        console.log(`✗ Artwork "${artwork.title}" has no matching artist profile for artist_id: ${artwork.artist_id}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkArtworks();
