/**
 * Post Controller
 * Handles HTTP requests and responses for post-related endpoints
 */

const Post = require('../models/Post');
const postService = require('../services/post/createPost');
const { verifyToken } = require('../utils/tokenManager');
const logger = require('../utils/logger');
const { POST_STATUS, HTTP_STATUS } = require('../config/constants');

/**
 * POST /post
 * Publish a post by ID (triggered from email link)
 * Validates token and marks post as published
 */
const publishPostHandler = async (req, res) => {
  try {
    const { id, token } = req.query;

    // Validate inputs
    if (!id || !token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required parameters: id and token',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      logger.warn(`Invalid token for post ${id}`);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Fetch post
    const post = await postService.getPostById(id);

    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if already posted
    if (post.status === POST_STATUS.POSTED) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: 'This post has already been published',
      });
    }

    // Check if expired
    if (post.tokenExpiredAt && new Date() > post.tokenExpiredAt) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'This link has expired (24-hour limit)',
      });
    }

    // Publish post
    const publishedPost = await postService.publishPost(id);

    if (!publishedPost) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: 'Failed to publish post',
      });
    }

    logger.info(`Post published via API: ${id}`);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Post published successfully!',
      data: {
        postId: publishedPost._id,
        status: publishedPost.status,
        postedAt: publishedPost.postedAt,
      },
    });
  } catch (error) {
    logger.error('Publish post handler error', error.message);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /skip
 * Skip a post (triggered from email link)
 */
const skipPostHandler = async (req, res) => {
  try {
    const { id, token } = req.query;

    // Validate inputs
    if (!id || !token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required parameters: id and token',
      });
    }

    // Verify token
    try {
      verifyToken(token);
    } catch (error) {
      logger.warn(`Invalid token for skip ${id}`);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Fetch and skip post
    const post = await postService.getPostById(id);

    if (!post) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Skip post
    const skippedPost = await postService.skipPost(id);

    if (!skippedPost) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: 'Failed to skip post',
      });
    }

    logger.info(`Post skipped via API: ${id}`);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Post skipped successfully',
      data: {
        postId: skippedPost._id,
        status: skippedPost.status,
      },
    });
  } catch (error) {
    logger.error('Skip post handler error', error.message);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /skip-all
 * Skip all of today's pending posts
 * Requires authentication or special token
 */
const skipAllHandler = async (req, res) => {
  try {
    const apiKey = req.query.key || req.headers['x-api-key'];

    // Simple API key check (in production, use proper auth)
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const skippedCount = await postService.skipAllTodaysPosts();

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Skipped ${skippedCount} posts`,
      data: { skippedCount },
    });
  } catch (error) {
    logger.error('Skip all handler error', error.message);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /posts
 * Get today's pending posts
 * Requires authentication
 */
const getPostsHandler = async (req, res) => {
  try {
    const apiKey = req.query.key || req.headers['x-api-key'];

    // Simple API key check
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const posts = await postService.getTodaysPendingPosts();

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        count: posts.length,
        posts,
      },
    });
  } catch (error) {
    logger.error('Get posts handler error', error.message);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /stats
 * Get post statistics
 * Requires authentication
 */
const getStatsHandler = async (req, res) => {
  try {
    const apiKey = req.query.key || req.headers['x-api-key'];

    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const stats = await postService.getPostStatistics();

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get stats handler error', error.message);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /health
 * Health check endpoint
 */
const healthHandler = (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  publishPostHandler,
  skipPostHandler,
  skipAllHandler,
  getPostsHandler,
  getStatsHandler,
  healthHandler,
};
