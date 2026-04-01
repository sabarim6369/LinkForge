/**
 * Token Utility
 * Generates and validates secure tokens for email links
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('./logger');

/**
 * Generate a secure token for a post
 * The token contains the post ID and expires in 24 hours
 * @param {string} postId - MongoDB Post ID
 * @returns {string} JWT token
 */
const generateToken = (postId) => {
  try {
    const token = jwt.sign(
      { postId, createdAt: new Date().toISOString() },
      config.TOKEN_SECRET,
      { expiresIn: config.TOKEN_EXPIRY }
    );
    return token;
  } catch (error) {
    logger.error('Token generation failed', error.message);
    throw error;
  }
};

/**
 * Verify and decode a token
 * @param {string} token - JWT token from email link
 * @returns {object} Decoded token data { postId, createdAt }
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.TOKEN_SECRET);
    return decoded;
  } catch (error) {
    logger.warn('Token verification failed', error.message);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate a random hash for additional security layer
 * @returns {string} Random hash
 */
const generateHash = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateToken,
  verifyToken,
  generateHash,
};
