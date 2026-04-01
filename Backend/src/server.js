/**
 * Server Entry Point
 * Initializes the Express server, database, and cron jobs
 */

// Load environment variables from .env file
require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const config = require('./config/env');
const logger = require('./utils/logger');
const { initializeCronJobs, stopAllCronJobs } = require('./cron/index');

/**
 * Start the server
 */
const startServer = async () => {
  try {
    logger.info('🚀 LinkForge Backend - Starting server...');
    logger.info(`Environment: ${config.NODE_ENV}`);

    // ============================================================
    // DATABASE CONNECTION
    // ============================================================
    logger.info('Connecting to MongoDB...');
    await connectDB();

    // ============================================================
    // CRON JOBS INITIALIZATION
    // ============================================================
    logger.info('Initializing cron jobs...');
    const cronInitialized = initializeCronJobs();
    if (!cronInitialized) {
      logger.warn('⚠️ Cron jobs failed to initialize, but server will continue');
    }

    // ============================================================
    // START EXPRESS SERVER
    // ============================================================
    const server = app.listen(config.PORT, () => {
      logger.info(`✅ Server started on port ${config.PORT}`);
      logger.info(`📍 Base URL: http://localhost:${config.PORT}`);

      // Print available endpoints
      logger.info('Available endpoints:');
      logger.info('  GET  /                   - Health check');
      logger.info('  GET  /health             - Server status');
      logger.info('  GET  /post?id=X&token=Y  - Publish post from email');
      logger.info('  GET  /skip?id=X&token=Y  - Skip post from email');
      logger.info('  GET  /posts?key=K        - Get pending posts (protected)');
      logger.info('  GET  /stats?key=K        - Get statistics (protected)');
      logger.info('  GET  /skip-all?key=K     - Skip all posts (protected)');

      if (config.NODE_ENV === 'development') {
        logger.info('  GET  /dev/run-daily-job  - Manually trigger daily job');
      }
    });

    // ============================================================
    // GRACEFUL SHUTDOWN
    // ============================================================
    const shutdown = async () => {
      logger.info('🛑 Shutting down...');

      // Stop cron jobs
      stopAllCronJobs();

      // Close server
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Force shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Uncaught exception handler
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception', error.message);
      shutdown();
    });

    // Unhandled rejection handler
    process.on('unhandledRejection', error => {
      logger.error('Unhandled rejection', error?.message || error);
      shutdown();
    });
  } catch (error) {
    logger.error('❌ Failed to start server', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
