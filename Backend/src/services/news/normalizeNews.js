/**
 * Normalize News Service
 * Converts data from different sources to a consistent format
 */

const logger = require('../../utils/logger');

/**
 * Normalize Hacker News story
 * @param {object} story - Hacker News story object
 * @returns {object|null} Normalized news object
 */
const normalizeHackerNews = (story) => {
  if (!story || !story.title || !story.url) return null;

  return {
    title: story.title.trim(),
    url: story.url,
    source: 'hackernews',
    publishedAt: new Date(story.time * 1000),
    engagement: (story.score || 0) + (story.descendants || 0) * 0.5, // Score + weighted comments
    sourceId: `hn-${story.id}`,
    rawData: story,
  };
};

/**
 * Normalize Dev.to article
 * @param {object} article - Dev.to article object
 * @returns {object|null} Normalized news object
 */
const normalizeDevTo = (article) => {
  if (!article || !article.title || !article.url) return null;

  return {
    title: article.title.trim(),
    url: article.url,
    source: 'dev.to',
    publishedAt: new Date(article.published_at),
    engagement:
      (article.positive_reactions_count || 0) +
      (article.comments_count || 0) * 0.5,
    sourceId: `devto-${article.id}`,
    rawData: article,
  };
};

/**
 * Normalize Product Hunt product
 * @param {object} product - Product Hunt product object
 * @returns {object|null} Normalized news object
 */
const normalizeProductHunt = (product) => {
  if (!product || !product.name || !product.url) return null;

  return {
    title: product.name.trim(),
    url: product.url,
    source: 'producthunt',
    publishedAt: new Date(product.created_at),
    engagement: product.votes_count || 0,
    sourceId: `ph-${product.id}`,
    rawData: product,
  };
};

/**
 * Normalize a single news item based on source detection
 * @param {object} item - Raw news item from any source
 * @param {string} detectedSource - Source identifier
 * @returns {object|null} Normalized news object
 */
const normalizeNewsItem = (item, detectedSource) => {
  try {
    switch (detectedSource) {
      case 'hackernews':
      case 'hn':
        return normalizeHackerNews(item);

      case 'dev.to':
      case 'devto':
        return normalizeDevTo(item);

      case 'producthunt':
      case 'ph':
        return normalizeProductHunt(item);

      default:
        logger.warn(`Unknown news source: ${detectedSource}`);
        return null;
    }
  } catch (error) {
    logger.debug(`Normalization error for item: ${error.message}`);
    return null;
  }
};

/**
 * Normalize all news items from mixed sources
 * Handles auto-detection of source type based on data structure
 * @param {Array} rawNews - Array of raw news items from various sources
 * @returns {Promise<Array>} Array of normalized news objects
 */
const normalizeAllNews = async (rawNews) => {
  try {
    const normalized = [];

    for (const item of rawNews) {
      let normalizedItem = null;

      // Auto-detect source by checking properties
      if (item.by && item.descendants !== undefined) {
        // Hacker News pattern
        normalizedItem = normalizeHackerNews(item);
      } else if (item.organization && item.positive_reactions_count !== undefined) {
        // Dev.to pattern
        normalizedItem = normalizeDevTo(item);
      } else if (item.maker && item.votes_count !== undefined) {
        // Product Hunt pattern
        normalizedItem = normalizeProductHunt(item);
      } else if (item.title && item.url) {
        // Generic article
        normalizedItem = {
          title: item.title.trim(),
          url: item.url,
          source: 'unknown',
          publishedAt: item.publishedAt || item.published_at || new Date(),
          engagement: item.engagement || item.score || 0,
          sourceId: `unknown-${Math.random()}`,
          rawData: item,
        };
      }

      if (normalizedItem) {
        normalized.push(normalizedItem);
      }
    }

    logger.info(`✅ Normalized ${normalized.length}/${rawNews.length} news items`);
    return normalized;
  } catch (error) {
    logger.error('Normalization failed', error.message);
    return [];
  }
};

module.exports = {
  normalizeHackerNews,
  normalizeDevTo,
  normalizeProductHunt,
  normalizeNewsItem,
  normalizeAllNews,
};
