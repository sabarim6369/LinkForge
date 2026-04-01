/**
 * Fetch News Service
 * Aggregates news from multiple sources (Hacker News, Dev.to, etc)
 */

const fetch = require('node-fetch');
const config = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Fetch from Hacker News API
 * Gets top 30 stories from the last 24 hours
 * @returns {Promise<Array>} Raw Hacker News data
 */
const fetchFromHackerNews = async () => {
  try {
    const response = await fetch(
      `${config.HACKER_NEWS_API}/topstories.json?print=pretty`,
      { timeout: 5000 }
    );

    if (!response.ok) throw new Error(`HN API returned ${response.status}`);

    const storyIds = await response.json();
    const topIds = storyIds.slice(0, 30); // Get top 30

    // Fetch details for each story in parallel
    const stories = await Promise.all(
      topIds.map(id =>
        fetch(`${config.HACKER_NEWS_API}/item/${id}.json?print=pretty`, {
          timeout: 3000,
        })
          .then(res => res.json())
          .catch(err => {
            logger.warn(`Failed to fetch HN story ${id}`, err.message);
            return null;
          })
      )
    );

    const filtered = stories.filter(story => story !== null && story.type === 'story');
    logger.info(`✅ Fetched ${filtered.length} stories from Hacker News`);

    return filtered;
  } catch (error) {
    logger.error('Hacker News fetch failed', error.message);
    return [];
  }
};

/**
 * Fetch from Dev.to API
 * Gets trending articles
 * @returns {Promise<Array>} Raw Dev.to data
 */
const fetchFromDevTo = async () => {
  try {
    const response = await fetch(
      'https://dev.to/api/articles?top=30&per_page=30',
      { timeout: 5000 }
    );

    if (!response.ok) throw new Error(`Dev.to API returned ${response.status}`);

    const articles = await response.json();
    logger.info(`✅ Fetched ${articles.length} articles from Dev.to`);

    return articles;
  } catch (error) {
    logger.error('Dev.to fetch failed', error.message);
    return [];
  }
};

/**
 * Fetch from Product Hunt API (requires API key)
 * Gets trending products
 * @returns {Promise<Array>} Raw Product Hunt data
 */
const fetchFromProductHunt = async () => {
  try {
    if (!process.env.PRODUCT_HUNT_API_KEY) {
      logger.warn('Product Hunt API key not configured');
      return [];
    }

    const response = await fetch('https://api.producthunt.com/v2/posts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PRODUCT_HUNT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`Product Hunt API returned ${response.status}`);
    }

    const data = await response.json();
    logger.info(`✅ Fetched ${data.data?.length || 0} products from Product Hunt`);

    return data.data || [];
  } catch (error) {
    logger.warn('Product Hunt fetch (optional) failed', error.message);
    return [];
  }
};

/**
 * Fetch news from RSS feeds (using external API)
 * Falls back to basic article fetching
 * @returns {Promise<Array>} Raw RSS feed data
 */
const fetchFromRSSFeeds = async () => {
  // In production, use a service like feedparser or rss-parser npm package
  // For now, returning empty as this requires more configuration
  try {
    logger.debug('RSS Feed fetching would require RSS parser library');
    return [];
  } catch (error) {
    logger.warn('RSS Feed fetch failed', error.message);
    return [];
  }
};

/**
 * Aggregate all news sources
 * Main entry point for fetching news from all available sources
 * @returns {Promise<Array>} Combined raw news data
 */
const fetchAllNews = async () => {
  logger.info('🔄 Starting news aggregation from all sources...');

  try {
    const [hnStories, devToArticles, phProducts, rssFeeds] = await Promise.allSettled([
      fetchFromHackerNews(),
      fetchFromDevTo(),
      fetchFromProductHunt(),
      fetchFromRSSFeeds(),
    ]);

    const combinedNews = [
      ...(hnStories.status === 'fulfilled' ? hnStories.value : []),
      ...(devToArticles.status === 'fulfilled' ? devToArticles.value : []),
      ...(phProducts.status === 'fulfilled' ? phProducts.value : []),
      ...(rssFeeds.status === 'fulfilled' ? rssFeeds.value : []),
    ];

    logger.info(`📰 Total news items fetched: ${combinedNews.length}`);
    return combinedNews;
  } catch (error) {
    logger.error('Fatal error in news fetching', error.message);
    return [];
  }
};

module.exports = {
  fetchFromHackerNews,
  fetchFromDevTo,
  fetchFromProductHunt,
  fetchFromRSSFeeds,
  fetchAllNews,
};
