const express = require('express');
const cors = require('cors');
require('dotenv').config();

const clientRoutes = require('../src/routes/clients');
const transactionRoutes = require('../src/routes/transactions');
const transactionController = require('../src/controllers/transactionController');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.use('/api/transactions', transactionRoutes);
app.get('/api/dashboard/stats', transactionController.getDashboardStats);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Client Payment Tracker API',
    timestamp: new Date().toISOString()
  });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Global server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Export for Vercel serverless
module.exports = app;
