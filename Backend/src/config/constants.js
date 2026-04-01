/**
 * Constants and Configuration Values
 */

module.exports = {
  // Post Status
  POST_STATUS: {
    PENDING: 'pending',
    POSTED: 'posted',
    SKIPPED: 'skipped',
  },

  // News Sources
  NEWS_SOURCES: {
    HACKER_NEWS: 'hackernews',
    TECH_CRUNCH: 'techcrunch',
    DEV_TO: 'dev.to',
    PRODUCT_HUNT: 'producthunt',
  },

  // Ranking Weights
  RANKING_WEIGHTS: {
    RECENCY: 0.25,          // Weight for recent news (hours old)
    ENGAGEMENT: 0.35,       // Weight for comments/upvotes
    KEYWORD_BOOST: 0.40,    // Weight for trending keywords
  },

  // Keywords that boost ranking
  TRENDING_KEYWORDS: [
    'ai',
    'artificial intelligence',
    'machine learning',
    'llm',
    'gpt',
    'groq',
    'openai',
    'security',
    'hack',
    'vulnerability',
    'crypto',
    'blockchain',
    'startup',
    'funding',
    'tech',
    'api',
    'database',
    'cloud',
    'devops',
  ],

  // Email Configuration
  EMAIL: {
    SUBJECT_PREFIX: '📬 LinkForge Daily Digest',
    HTML_TEMPLATE: 'emailTemplate',
    POSTS_PER_DIGEST: 4,
  },

  // Token Configuration
  TOKEN: {
    ALGORITHM: 'HS256',
    EXPIRY_HOURS: 24,
  },

  // Limits
  LIMITS: {
    MIN_POSTS_TO_SEND: 1,
    MAX_POSTS_TO_SEND: 4,
    MIN_TITLE_LENGTH: 10,
    MAX_TITLE_LENGTH: 500,
  },

  // API Response Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
  },
};
