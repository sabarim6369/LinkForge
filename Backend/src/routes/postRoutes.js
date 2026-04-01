/**
 * Post Routes
 * Defines all API endpoints for post management
 */

const express = require('express');
const router = express.Router();
const {
  publishPostHandler,
  skipPostHandler,
  skipAllHandler,
  getPostsHandler,
  getStatsHandler,
  healthHandler,
} = require('../controllers/postController');

// Public Routes (from email links)
/**
 * POST /post?id=POST_ID&token=TOKEN
 * Publish a post (triggered from email link)
 * Query params: id (post ID), token (JWT token)
 */
router.get('/post', publishPostHandler);

/**
 * GET /skip?id=POST_ID&token=TOKEN
 * Skip a post (triggered from email link)
 */
router.get('/skip', skipPostHandler);

// Protected Routes (require API key)
/**
 * GET /skip-all?key=API_KEY
 * Skip all of today's pending posts
 */
router.get('/skip-all', skipAllHandler);

/**
 * GET /posts?key=API_KEY
 * Get today's pending posts
 */
router.get('/posts', getPostsHandler);

/**
 * GET /stats?key=API_KEY
 * Get post statistics
 */
router.get('/stats', getStatsHandler);

/**
 * GET /health
 * Health check endpoint (no auth required)
 */
router.get('/health', healthHandler);

module.exports = router;
