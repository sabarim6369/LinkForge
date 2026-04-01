/**
 * Post Model
 * MongoDB schema for storing AI-generated posts
 */

const mongoose = require('mongoose');
const { POST_STATUS } = require('../config/constants');

const postSchema = new mongoose.Schema(
  {
    // Post Content
    content: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 2000,
      description: 'AI-generated LinkedIn post content',
    },

    // Source Information
    sourceTitles: {
      type: [String],
      default: [],
      description: 'Original news titles that generated this post',
    },

    sourceUrls: {
      type: [String],
      default: [],
      description: 'Original news URLs',
    },

    sources: {
      type: [String],
      default: [],
      description: 'Source names (hackernews, techcrunch, etc)',
    },

    // Scoring and Ranking
    score: {
      type: Number,
      default: 0,
      description: 'Combined ranking score for this post',
    },

    // Post Status Tracking
    status: {
      type: String,
      enum: Object.values(POST_STATUS),
      default: POST_STATUS.PENDING,
      description: 'Current status of the post',
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      description: 'When the post was generated',
    },

    postedAt: {
      type: Date,
      default: null,
      description: 'When the post was actually published',
    },

    skippedAt: {
      type: Date,
      default: null,
      description: 'When the post was skipped',
    },

    // Email Tracking
    emailSentAt: {
      type: Date,
      default: null,
      description: 'When this post was included in an email digest',
    },

    tokenExpiredAt: {
      type: Date,
      default: null,
      description: 'When the email link token expires',
    },

    // Metadata
    hashtags: {
      type: [String],
      default: [],
      description: 'Extracted or generated hashtags',
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      description: 'Additional metadata or AI generation parameters',
    },
  },
  {
    timestamps: true,
    collection: 'posts',
  }
);

// Indexes for efficient querying
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ postedAt: 1 });

// Virtual for checking if post is expired
postSchema.virtual('isExpired').get(function () {
  if (!this.tokenExpiredAt) return false;
  return new Date() > this.tokenExpiredAt;
});

// Virtual for days old
postSchema.virtual('daysOld').get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
