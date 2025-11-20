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
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Function to ensure default admin account exists
async function ensureDefaultAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('✅ Default admin account verified:', adminEmail);
      return;
    }

    // Create default admin account
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      full_name: 'Admin User',
      user_type: 'admin'
    });

    await adminUser.save();
    console.log('✅ Default admin account created:', adminEmail, '/', adminPassword);
  } catch (error) {
    console.error('❌ Error ensuring default admin account:', error);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://visual_art:visual%40123@cluster0.lotlyct.mongodb.net/visual_Art?retryWrites=true&w=majority')
.then(async () => {
  console.log('MongoDB connected');
  // Ensure default admin account exists after DB connection
  await ensureDefaultAdmin();
})
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/artist-profiles', require('./routes/artistProfiles'));
app.use('/api/artworks', require('./routes/artworks'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/address', require('./routes/address'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'VisualArt Backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
