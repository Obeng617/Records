// Vercel Serverless Entry Point - Re-exports express app from src/index.js
const app = require('../src/index.js');

module.exports = app;
