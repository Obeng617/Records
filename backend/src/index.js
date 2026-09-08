const express = require('express');
const cors = require('cors');
require('dotenv').config();

const clientRoutes = require('./routes/clients');
const transactionRoutes = require('./routes/transactions');
const transactionController = require('./controllers/transactionController');

const app = express();
const PORT = process.env.PORT || 5000;

// Global CORS middleware - ensure headers are set for ALL responses including preflights and errors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With, Accept, Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false
}));

app.use(express.json());

// Prevent HTTP caching on all API routes so client/dashboard data is always fresh
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/clients', clientRoutes);

app.use('/api/transactions', transactionRoutes);
app.use('/transactions', transactionRoutes);

app.get('/api/dashboard/stats', transactionController.getDashboardStats);
app.get('/dashboard/stats', transactionController.getDashboardStats);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Client Payment Tracker API',
    timestamp: new Date().toISOString()
  });
});
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Client Payment Tracker API',
    timestamp: new Date().toISOString()
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Global server error:', err);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n Client Payment Tracker Backend running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health\n`);
});

