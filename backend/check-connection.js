/**
 * MongoDB Connection Diagnostic Tool
 * Checks current IP and tests MongoDB Atlas connection
 */

const mongoose = require('mongoose');
const https = require('https');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('='.repeat(60));
console.log('MongoDB Connection Diagnostic');
console.log('='.repeat(60));
console.log('');

// Step 1: Check MongoDB URI
console.log('1. Checking MongoDB URI...');
if (!MONGODB_URI) {
  console.log('   ❌ MONGODB_URI not found in .env file');
  process.exit(1);
}
console.log('   ✅ MONGODB_URI found');
const maskedUri = MONGODB_URI.replace(/:[^:@]+@/, ':****@');
console.log('   URI:', maskedUri);
console.log('');

// Step 2: Get current public IP
console.log('2. Checking your current public IP address...');
https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const ipInfo = JSON.parse(data);
      const currentIP = ipInfo.ip;
      console.log('   ✅ Your current public IP:', currentIP);
      console.log('   📝 Add this IP to MongoDB Atlas Network Access:', `${currentIP}/32`);
      console.log('   🔗 Direct link: https://cloud.mongodb.com/v2#/security/network/whitelist');
      console.log('');

      // Step 3: Test MongoDB connection
      console.log('3. Testing MongoDB Atlas connection...');
      console.log('   Attempting to connect (this may take 10-15 seconds)...');
      
      const options = {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      };

      mongoose.connect(MONGODB_URI, options)
        .then(() => {
          console.log('   ✅ SUCCESS! MongoDB connection established!');
          console.log('   Database:', mongoose.connection.db.databaseName);
          console.log('');
          console.log('='.repeat(60));
          console.log('Connection is working! Your backend should connect now.');
          console.log('='.repeat(60));
          mongoose.disconnect();
          process.exit(0);
        })
        .catch((err) => {
          console.log('   ❌ Connection failed');
          console.log('   Error:', err.message);
          console.log('');
          console.log('='.repeat(60));
          console.log('FIX REQUIRED:');
          console.log('='.repeat(60));
          console.log('');
          console.log('Your IP address needs to be whitelisted in MongoDB Atlas:');
          console.log(`   1. Go to: https://cloud.mongodb.com/v2#/security/network/whitelist`);
          console.log(`   2. Click "Add IP Address"`);
          console.log(`   3. Enter: ${currentIP}/32`);
          console.log(`   4. Click "Confirm"`);
          console.log(`   5. Wait 1-2 minutes for changes to take effect`);
          console.log(`   6. Restart backend: npm run start:fresh`);
          console.log('');
          console.log('Alternative: Allow from anywhere (less secure, for testing):');
          console.log('   Add IP: 0.0.0.0/0');
          console.log('='.repeat(60));
          process.exit(1);
        });
    } catch (err) {
      console.log('   ⚠️  Could not fetch IP address');
      console.log('   Proceeding with connection test...');
      testConnection();
    }
  });
}).on('error', (err) => {
  console.log('   ⚠️  Could not fetch IP address:', err.message);
  console.log('   Proceeding with connection test...');
  testConnection();
});

function testConnection() {
  console.log('');
  console.log('3. Testing MongoDB Atlas connection...');
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  };

  mongoose.connect(MONGODB_URI, options)
    .then(() => {
      console.log('   ✅ SUCCESS! MongoDB connection established!');
      mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.log('   ❌ Connection failed:', err.message);
      console.log('');
      console.log('Your IP address needs to be whitelisted in MongoDB Atlas.');
      console.log('Go to: https://cloud.mongodb.com/v2#/security/network/whitelist');
      process.exit(1);
    });
}
