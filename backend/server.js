const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory so MONGODB_URI is always found (even when run from project root)
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware — allow localhost (dev) and production frontend (FRONTEND_URL / Vercel)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180', 'http://localhost:5181', 'http://localhost:5182', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:5176', 'http://127.0.0.1:5177', 'http://127.0.0.1:5178', 'http://127.0.0.1:5179', 'http://127.0.0.1:5180', 'http://10.67.109.231:5174', 'https://new-sigma-lime-91.vercel.app'];
const frontendUrl = process.env.FRONTEND_URL || '';
if (frontendUrl) allowedOrigins.push(frontendUrl);
// Allow any Vercel preview (*.vercel.app)
const isVercelOrigin = (o) => o && /^https:\/\/[^.]+\.vercel\.app$/.test(o);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || isVercelOrigin(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return cb(null, true);
    cb(null, false);
  },
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



// MongoDB: use MONGODB_URI from .env (e.g. Atlas mongodb+srv://...) or fallback to local
const localUri = 'mongodb://localhost:27017/test';
const primaryUri = process.env.MONGODB_URI || localUri;

const isAtlasUri = (uri) => uri && (uri.startsWith('mongodb+srv://') || uri.includes('ssl=true'));

const connectWithUri = async (uri, label) => {
  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
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
  const dbName = (uri.includes('/') ? uri.split('/').pop().split('?')[0] : '') || 'test';
  console.log(`✅ MongoDB connected (${label}): database "${dbName}" — data will be saved here.`);
  // Ensure collections exist in this database (Mongoose creates on first write; this creates them upfront in Atlas)
  const db = mongoose.connection.db;
  const collections = ['users', 'addresses', 'wishlists', 'artworks', 'orders', 'reviews', 'artistprofiles'];
  for (const collName of collections) {
    await db.createCollection(collName).catch(() => {});
  }
  return true;
};

const connectDB = async () => {
  const maxAttempts = 3;
  const urisToTry = [primaryUri];
  if (primaryUri !== localUri) {
    urisToTry.push(localUri);
  }

  const uriLabel = (uri) => (uri === localUri ? 'local' : 'MONGODB_URI');
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const uri of urisToTry) {
      const label = uriLabel(uri);
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

  console.error('❌ Could not connect to MongoDB. Data will NOT be saved until connected.');
  console.log('  Atlas: whitelist your IP at https://cloud.mongodb.com → Network Access (e.g. 157.32.122.224/32).');
  console.log('  Then restart backend: npm run start:fresh');
  return false;
};

// Track if MongoDB is connected (so API can return 503 when DB is down)
let dbConnected = false;

// Middleware: require DB for all /api routes except health
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!dbConnected) {
    console.warn('[503] Request rejected: database not connected. Data will NOT be saved. Check http://localhost:5000/api/health');
    return res.status(503).json({
      message: 'Database not connected — data cannot be saved. 1) Open http://localhost:5000/api/health  2) Whitelist your IP in Atlas → Network Access  3) Restart backend: npm run start:fresh',
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
  const dbName = mongoose.connection.db?.databaseName || null;
  res.json({
    status: dbConnected ? 'OK' : 'DEGRADED',
    message: 'VisualArt Backend is running',
    database: dbConnected ? 'connected' : 'disconnected',
    databaseName: dbName,
    note: !dbConnected ? 'Data will NOT be saved until MongoDB is connected. Restart backend from backend folder and check Atlas IP whitelist.' : null,
  });
});

const PORT = process.env.PORT || 5000;

// Start HTTP server immediately so frontend can connect; connect DB in background
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

// Handle port binding errors (e.g., EADDRINUSE)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Data may not be saving because the OLD process may not be connected to MongoDB.`);
    console.error(`Fix: Stop the process on port ${PORT}, then run "npm run start" from the backend folder.`);
    console.error(`  Windows: netstat -ano | findstr :${PORT}   then  taskkill /PID <number> /F`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

function setDbConnected(connected) {
  dbConnected = !!connected;
}

// Log which MongoDB we're using (mask credentials)
const safeUri = primaryUri.replace(/:[^:@]+@/, ':****@').replace(/\?.*$/, '');
console.log('MongoDB: using', process.env.MONGODB_URI ? `MONGODB_URI (${safeUri})` : 'local (localhost:27017/test)');

connectDB()
  .then((connected) => {
    setDbConnected(connected);
    if (connected) {
      const dbName = mongoose.connection.db?.databaseName || 'test';
      console.log(`Backend ready. Data will be saved to Atlas database "${dbName}" (users, orders, etc.).`);
    } else {
      console.warn('Backend is up but database is NOT connected. Signup/login will return 503. Whitelist IP in Atlas and run: npm run start:fresh');
      scheduleReconnect();
    }
  })
  .catch((err) => {
    setDbConnected(false);
    console.error('DB connection error:', err?.message || err);
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