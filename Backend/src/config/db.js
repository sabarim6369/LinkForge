/**
 * Database Connection Configuration
 * Establishes connection to MongoDB using Mongoose
 */

const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB disconnected');
  } catch (error) {
    logger.error(`❌ MongoDB disconnection failed: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
