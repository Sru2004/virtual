const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5177', 'http://127.0.0.1:5178', 'http://10.67.109.231:5174', 'https://new-sigma-lime-91.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Handle preflight requests
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));



// Connect to MongoDB (use MONGODB_URI when provided)
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://srujana:Srujana123@cluster0.37lwfdw.mongodb.net/?appName=Cluster0';
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  // Try to show only the database name to avoid leaking credentials
  const dbName = (mongoUri.includes('/') ? mongoUri.split('/').pop().split('?')[0] : '(unknown)') || '(unknown)';
  console.log(`✅ MongoDB connected successfully (db: ${dbName})`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('🔧 Troubleshooting steps:');
  console.log('1. Ensure your MongoDB instance is reachable');
  console.log('2. If using Atlas set `MONGODB_URI` in your .env');
  console.log('3. Check that the database name in the connection string is correct');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/artist-profiles', require('./routes/artistProfiles'));
app.use('/api/artworks', require('./routes/artworks'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/address', require('./routes/address'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'VisualArt Backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
