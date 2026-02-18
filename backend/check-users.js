/**
 * Debug script: Check users in the database and validate passwords
 * Run from backend folder: node check-users.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function checkUsers() {
  try {
    console.log('Attempting to connect to:', mongoUri.replace(/:[^:@]+@/, ':****@'));
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.db?.databaseName || 'unknown');

    // Get all users (without passwords)
    const users = await User.find({}, '-password').lean();
    console.log('\n=== Users in database ===');
    console.log('Total users:', users.length);
    
    if (users.length === 0) {
      console.log('\nNo users found! You need to register first.');
      console.log('Run the seed script: node seed-artworks.js');
    } else {
      users.forEach((user, i) => {
        console.log(`\nUser ${i + 1}:`);
        console.log('  Email:', user.email);
        console.log('  Name:', user.full_name);
        console.log('  Type:', user.user_type);
        console.log('  ID:', user._id);
      });
    }

    // Check if demo user exists
    const demoUser = await User.findOne({ email: 'demo@visualart.com' });
    console.log('\n=== Demo User Check ===');
    if (demoUser) {
      console.log('Demo user EXISTS in database');
      console.log('Email:', demoUser.email);
      console.log('Password hash:', demoUser.password.substring(0, 20) + '...');
      
      // Test password
      const testPassword = 'Demo123!';
      const isMatch = await bcrypt.compare(testPassword, demoUser.password);
      console.log('Testing password "Demo123!":', isMatch ? '✅ MATCH' : '❌ NO MATCH');
    } else {
      console.log('Demo user DOES NOT exist in database');
      console.log('Run: node seed-artworks.js to create demo user');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUsers();
