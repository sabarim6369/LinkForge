/**
 * Post Service
 * Core business logic for managing posts (create, approve, publish, skip)
 */

const Post = require('../../models/Post');
const logger = require('../../utils/logger');
const { generateToken } = require('../../utils/tokenManager');
const { POST_STATUS } = require('../../config/constants');

/**
 * Create multiple posts from AI-generated content
 * Stores posts in MongoDB with pending status
 * @param {Array} generatedPosts - Array of post objects from AI service
 * @returns {Promise<Array>} Created post objects with database IDs
 */
const createPosts = async (generatedPosts) => {
  try {
    if (!generatedPosts || generatedPosts.length === 0) {
      logger.warn('No posts to create');
      return [];
    }

    // Add tokens and expiry to each post
    const postsWithTokens = generatedPosts.map(post => ({
      ...post,
      token: generateToken(null), // Token generated without ID yet
      tokenExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    }));

    // Bulk create in MongoDB
    const createdPosts = await Post.insertMany(postsWithTokens);

    // Regenerate tokens with actual post IDs (for security)
    const updatedPosts = await Promise.all(
      createdPosts.map(async post => {
        post.token = generateToken(post._id.toString());
        await post.save();
        return post;
      })
    );

    logger.info(`✅ Created ${updatedPosts.length} posts in database`);
    return updatedPosts;
  } catch (error) {
    logger.error('Post creation failed', error.message);
    return [];
  }
};

/**
 * Get today's pending posts
 * Retrieves all posts created today with pending status
 * @returns {Promise<Array>} Array of pending posts
 */
const getTodaysPendingPosts = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const posts = await Post.find({
      status: POST_STATUS.PENDING,
      createdAt: { $gte: today },
    }).sort({ score: -1 });

    logger.info(`Found ${posts.length} pending posts from today`);
    return posts;
  } catch (error) {
    logger.error('Fetch pending posts failed', error.message);
    return [];
  }
};

/**
 * Publish a post (mark as posted)
 * Updates post status and timestamp
 * Simulates actual LinkedIn publishing (would integrate with LinkedIn API in production)
 * @param {string} postId - MongoDB post ID
 * @returns {Promise<object|null>} Updated post or null
 */
const publishPost = async (postId) => {
  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        status: POST_STATUS.POSTED,
        postedAt: new Date(),
      },
      { new: true }
    );

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    logger.info(`✅ Post published: ${postId}`);
    return post;
  } catch (error) {
    logger.error('Post publishing failed', error.message);
    return null;
  }
};

/**
 * Skip post
 * Marks a single post as skipped
 * @param {string} postId - MongoDB post ID
 * @returns {Promise<object|null>} Updated post or null
 */
const skipPost = async (postId) => {
  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        status: POST_STATUS.SKIPPED,
        skippedAt: new Date(),
      },
      { new: true }
    );

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    logger.info(`⏭️ Post skipped: ${postId}`);
    return post;
  } catch (error) {
    logger.error('Post skipping failed', error.message);
    return null;
  }
};

/**
 * Skip all of today's posts
 * Marks all pending posts from today as skipped
 * @returns {Promise<number>} Number of posts skipped
 */
const skipAllTodaysPosts = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await Post.updateMany(
      {
        status: POST_STATUS.PENDING,
        createdAt: { $gte: today },
      },
      {
        status: POST_STATUS.SKIPPED,
        skippedAt: new Date(),
      }
    );

    logger.info(`⏭️ Skipped ${result.modifiedCount} posts from today`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('Bulk skip failed', error.message);
    return 0;
  }
};

/**
 * Get a post by ID with validation
 * @param {string} postId - MongoDB post ID
 * @returns {Promise<object|null>} Post document or null
 */
const getPostById = async (postId) => {
  try {
    const post = await Post.findById(postId);
    return post;
  } catch (error) {
    logger.warn(`Post retrieval failed for ID: ${postId}`, error.message);
    return null;
  }
};

/**
 * Get post statistics
 * Useful for monitoring and dashboard
 * @returns {Promise<object>} Statistics object
 */
const getPostStatistics = async () => {
  try {
    const stats = await Post.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      posted: 0,
      skipped: 0,
      total: 0,
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    logger.debug('Post statistics', formattedStats);
    return formattedStats;
  } catch (error) {
    logger.error('Statistics calculation failed', error.message);
    return { pending: 0, posted: 0, skipped: 0, total: 0 };
  }
};

module.exports = {
  createPosts,
  getTodaysPendingPosts,
  publishPost,
  skipPost,
  skipAllTodaysPosts,
  getPostById,
  getPostStatistics,
};
