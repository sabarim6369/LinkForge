/**
 * Rank News Service
 * Scores and ranks news items based on multiple factors
 */

const { RANKING_WEIGHTS, TRENDING_KEYWORDS } = require('../../config/constants');
const logger = require('../../utils/logger');

/**
 * Calculate recency score
 * Recent articles score higher, older ones score lower
 * @param {Date} publishedAt - Publication date
 * @returns {number} Score 0-100
 */
const calculateRecencyScore = (publishedAt) => {
  const now = new Date();
  const hoursOld = (now - new Date(publishedAt)) / (1000 * 60 * 60);

  // Score decay: full score at 0-6 hours, then 10% loss per hour
  if (hoursOld <= 6) return 100;
  if (hoursOld >= 48) return 0;

  const score = Math.max(0, 100 - (hoursOld - 6) * 5);
  return Math.round(score);
};

/**
 * Calculate engagement score
 * Normalize engagement metrics to 0-100 scale
 * Uses logarithm for sublinear growth (prevents outliers from dominating)
 * @param {number} engagement - Raw engagement count (comments, votes, etc)
 * @returns {number} Score 0-100
 */
const calculateEngagementScore = (engagement) => {
  // Use logarithmic scale to prevent extreme values
  // Log scale: 1 engagement = base score, 1000 = near max
  const baseScore = Math.log10(Math.max(1, engagement) + 1) * 20;
  return Math.min(100, baseScore);
};

/**
 * Calculate keyword boost score
 * Articles with trending keywords get boosted
 * @param {string} title - Article title
 * @returns {number} Score 0-100 (0 = no trending keywords, 100 = multiple matches)
 */
const calculateKeywordScore = (title) => {
  const lowerTitle = title.toLowerCase();
  let matchCount = 0;
  let maxPossibleMatches = 0;

  for (const keyword of TRENDING_KEYWORDS) {
    maxPossibleMatches++;
    if (lowerTitle.includes(keyword)) {
      matchCount++;
    }
  }

  // Score based on match ratio
  // Multiple matches = higher boost
  const matchRatio = matchCount / Math.max(1, maxPossibleMatches / 5);
  return Math.min(100, matchRatio * 50);
};

/**
 * Calculate combined ranking score
 * Uses weighted sum of all scoring factors
 * @param {object} newsItem - Normalized news item
 * @returns {object} News item with added score property
 */
const scoreNewsItem = (newsItem) => {
  try {
    const recencyScore = calculateRecencyScore(newsItem.publishedAt);
    const engagementScore = calculateEngagementScore(newsItem.engagement);
    const keywordScore = calculateKeywordScore(newsItem.title);

    // Apply weights
    const combinedScore =
      recencyScore * RANKING_WEIGHTS.RECENCY +
      engagementScore * RANKING_WEIGHTS.ENGAGEMENT +
      keywordScore * RANKING_WEIGHTS.KEYWORD_BOOST;

    return {
      ...newsItem,
      score: Math.round(combinedScore),
      _scoring: {
        recency: recencyScore,
        engagement: engagementScore,
        keyword: keywordScore,
      },
    };
  } catch (error) {
    logger.warn(`Scoring error for "${newsItem.title}": ${error.message}`);
    return { ...newsItem, score: 0 };
  }
};

/**
 * Rank all news items
 * Sorts by combined score in descending order
 * @param {Array} normalizedNews - Array of normalized news items
 * @returns {Array} Sorted news items with scores
 */
const rankNews = (normalizedNews) => {
  try {
    // Score each item
    const scoredNews = normalizedNews.map(item => scoreNewsItem(item));

    // Sort by score descending
    const rankedNews = scoredNews.sort((a, b) => b.score - a.score);

    logger.info(`📊 Ranking complete. Top scorer: "${rankedNews[0]?.title}" (${rankedNews[0]?.score || 0})`);

    return rankedNews;
  } catch (error) {
    logger.error('Ranking failed', error.message);
    return normalizedNews;
  }
};

/**
 * Get top N news items
 * Convenience method to get top articles after ranking
 * @param {Array} normalizedNews - Array of normalized news items
 * @param {number} limit - Number of top articles to return
 * @returns {Array} Top N ranked articles
 */
const getTopNews = (normalizedNews, limit = 10) => {
  const ranked = rankNews(normalizedNews);
  return ranked.slice(0, limit);
};

module.exports = {
  calculateRecencyScore,
  calculateEngagementScore,
  calculateKeywordScore,
  scoreNewsItem,
  rankNews,
  getTopNews,
};
