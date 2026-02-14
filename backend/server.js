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
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:5177', 'http://127.0.0.1:5178', 'http://10.67.109.231:5174', 'https://new-sigma-lime-91.vercel.app'],
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



// MongoDB: prefer MONGODB_URI from .env; else try Atlas; fallback to local
const atlasUri = 'mongodb+srv://srujana:Srujana123@cluster0.37lwfdw.mongodb.net/?appName=Cluster0&directConnection=true';
const localUri = 'mongodb://localhost:27017/visualart';
const primaryUri = process.env.MONGODB_URI || atlasUri;

const isAtlasUri = (uri) => uri && uri.startsWith('mongodb+srv://');

const connectWithUri = async (uri, label) => {
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 1,
  };
  if (isAtlasUri(uri)) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = true;
    options.tlsAllowInvalidHostnames = true;
  }
  await mongoose.connect(uri, options);
  await new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) resolve();
    else {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    }
  });
  const dbName = (uri.includes('/') ? uri.split('/').pop().split('?')[0] : '') || 'visualart';
  console.log(`✅ MongoDB connected (${label}: ${dbName})`);
  return true;
};

const connectDB = async () => {
  const maxAttempts = 3;
  const urisToTry = [primaryUri];
  if (primaryUri !== localUri) {
    urisToTry.push(localUri);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const uri of urisToTry) {
      const label = uri === localUri ? 'local' : (uri === atlasUri ? 'Atlas' : 'MONGODB_URI');
      try {
        if (mongoose.connection.readyState === 1) {
          return true;
        }
        await connectWithUri(uri, label);
        return true;
      } catch (err) {
        if (uri === localUri) {
          console.warn(`Local MongoDB not available (${err.message}). Install MongoDB or use Atlas.`);
        } else {
          console.error(`❌ MongoDB [${label}] attempt ${attempt}/${maxAttempts}:`, err.message);
        }
        if (mongoose.connection.readyState !== 0) {
          try {
            await mongoose.disconnect();
          } catch (_) {}
        }
      }
    }
    if (attempt < maxAttempts) {
      console.log(`Retrying MongoDB connection in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.error('❌ Could not connect to MongoDB. Options:');
  console.log('  1. Use local: install MongoDB and run it, then restart backend.');
  console.log('  2. Use Atlas: set MONGODB_URI in backend/.env and whitelist your IP at https://cloud.mongodb.com → Network Access.');
  return false;
};

// Track if MongoDB is connected (so API can return 503 when DB is down)
let dbConnected = false;

// Middleware: require DB for all /api routes except health
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!dbConnected) {
    return res.status(503).json({
      message: 'Database temporarily unavailable. Please check MongoDB connection (e.g. Atlas IP whitelist).',
      code: 'DB_DISCONNECTED',
    });
  }
  next();
});

// Routes (loaded but only active when DB is connected)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/artist-profiles', require('./routes/artistProfiles'));
app.use('/api/artworks', require('./routes/artworks'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/address', require('./routes/address'));
app.use('/api/admin', require('./routes/admin'));

// Health check (always responds; indicates DB status)
app.get('/api/health', (req, res) => {
  res.json({
    status: dbConnected ? 'OK' : 'DEGRADED',
    message: 'VisualArt Backend is running',
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

const PORT = process.env.PORT || 5000;

// Start HTTP server immediately so frontend can connect; connect DB in background
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

function setDbConnected(connected) {
  dbConnected = !!connected;
}

connectDB()
  .then((connected) => {
    setDbConnected(connected);
    if (connected) {
      console.log('Backend ready. Database connected.');
    } else {
      console.warn('Backend is up but database is not connected. API will return 503 until MongoDB is available.');
      scheduleReconnect();
    }
  })
  .catch(() => {
    setDbConnected(false);
    scheduleReconnect();
  });

mongoose.connection.on('disconnected', () => {
  setDbConnected(false);
  console.warn('MongoDB disconnected. API will return 503 until reconnected.');
  scheduleReconnect();
});

let reconnectTimer = null;
function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (dbConnected) return;
    console.log('Attempting to reconnect to MongoDB...');
    const connected = await connectDB();
    setDbConnected(connected);
    if (!connected) scheduleReconnect();
  }, 10000);
}

module.exports = app;
