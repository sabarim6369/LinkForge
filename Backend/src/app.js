/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const logger = require('./utils/logger');

// Import routes
const postRoutes = require('./routes/postRoutes');

// Initialize Express app
const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'LinkForge Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Post routes
app.use('/', postRoutes);

// Development route for manual cron job execution
if (config.NODE_ENV === 'development') {
  const { executeDailyJob } = require('./cron/index');

  app.get('/dev/run-daily-job', async (req, res) => {
    logger.info('🔧 Manual daily job trigger from /dev/run-daily-job');
    const result = await executeDailyJob();
    res.json(result);
  });

  logger.info('🔧 Development routes enabled: /dev/run-daily-job');
}

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
