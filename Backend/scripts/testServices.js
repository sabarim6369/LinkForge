/**
 * Example/Test Script for LinkForge Backend
 * Demonstrates how to use various services individually
 * 
 * Usage: node scripts/testServices.js
 */

require('dotenv').config();
const logger = require('../src/utils/logger');

// Import services
const fetchNews = require('../src/services/news/fetchNews');
const normalizeNews = require('../src/services/news/normalizeNews');
const deduplicateNews = require('../src/services/news/deduplicate');
const rankNews = require('../src/services/news/rankNews');
const generatePost = require('../src/services/ai/generatePost');
const tokenManager = require('../src/utils/tokenManager');

/**
 * Test 1: String Similarity
 */
const testSimilarity = async () => {
  logger.info('📝 Test 1: String Similarity');
  const similarity = require('../src/utils/similarity');

  const title1 = 'OpenAI releases GPT-5: Revolutionary AI breakthrough';
  const title2 = 'OpenAI announces GPT-5: Game-changing artificial intelligence';

  const score = similarity.calculateSimilarity(title1, title2);
  logger.info(`Similarity: ${title1} vs ${title2} = ${score}%`);

  const isSimilar = similarity.isSimilar(title1, title2, 80);
  logger.info(`Are they similar (80% threshold)? ${isSimilar}`);
};

/**
 * Test 2: Token Generation
 */
const testTokens = async () => {
  logger.info('🔐 Test 2: Token Generation & Verification');

  const testId = '507f1f77bcf86cd799439011';
  const token = tokenManager.generateToken(testId);
  logger.info(`Generated token: ${token.substring(0, 30)}...`);

  try {
    const decoded = tokenManager.verifyToken(token);
    logger.info(`✅ Token verified. PostId: ${decoded.postId}`);
  } catch (error) {
    logger.error('Token verification failed', error.message);
  }
};

/**
 * Test 3: Groq Connection
 */
const testGroqConnection = async () => {
  logger.info('🤖 Test 3: Groq API Connection');

  const apiOk = await generatePost.testGroqConnection();
  if (apiOk) {
    logger.info('✅ Groq API is accessible');
  } else {
    logger.error('❌ Groq API connection failed');
  }
};

/**
 * Test 4: Sample Post Generation
 */
const testPostGeneration = async () => {
  logger.info('📝 Test 4: Sample Post Generation');

  const sampleNews = [
    {
      title: 'Google Announces Revolutionary Quantum Computing Breakthrough',
      url: 'https://example.com/google-quantum',
      source: 'techcrunch',
      publishedAt: new Date(),
      engagement: 150,
      score: 85,
    },
    {
      title: 'Open Source AI Model Surpasses Commercial Solutions',
      url: 'https://example.com/open-source-ai',
      source: 'hackernews',
      publishedAt: new Date(),
      engagement: 200,
      score: 88,
    },
  ];

  const post = await generatePost.generatePost(sampleNews);

  if (post) {
    logger.info('✅ Post generated successfully:');
    logger.info(`\n${post}\n`);
  } else {
    logger.warn('⚠️ Post generation returned null (check API key)');
  }
};

/**
 * Test 5: News Ranking
 */
const testRanking = async () => {
  logger.info('📊 Test 5: News Ranking Algorithm');

  const sampleNews = [
    {
      title: 'AI Security Vulnerability Discovered in OpenAI GPT',
      url: 'https://example.com/1',
      source: 'hackernews',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour old
      engagement: 150,
    },
    {
      title: 'New Startup Secures $100M Funding for Machine Learning Platform',
      url: 'https://example.com/2',
      source: 'techcrunch',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours old
      engagement: 45,
    },
    {
      title: 'JavaScript Framework: React vs Vue vs Svelte Comparison',
      url: 'https://example.com/3',
      source: 'dev.to',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours old
      engagement: 30,
    },
  ];

  const ranked = rankNews.rankNews(sampleNews);

  logger.info('Ranked results:');
  ranked.forEach((news, idx) => {
    logger.info(
      `${idx + 1}. "${news.title.substring(0, 50)}..." - Score: ${news.score}`
    );
    logger.info(
      `   Breakdown - Recency: ${news._scoring.recency}, Engagement: ${news._scoring.engagement}, Keyword: ${news._scoring.keyword}`
    );
  });
};

/**
 * Test 6: Deduplication
 */
const testDeduplication = async () => {
  logger.info('🔄 Test 6: Deduplication');

  const normalizedNews = [
    {
      title: 'OpenAI Releases GPT-5: Breakthrough in AI',
      url: 'https://example.com/gpt5-v1',
      source: 'techcrunch',
      publishedAt: new Date(),
      engagement: 200,
    },
    {
      title: 'OpenAI Announces GPT-5: Revolutionary AI Model',
      url: 'https://example.com/gpt5-v2',
      source: 'hackernews',
      publishedAt: new Date(),
      engagement: 180,
    },
    {
      title: 'Google Launches New Cloud Service for Data Analytics',
      url: 'https://example.com/google-cloud',
      source: 'dev.to',
      publishedAt: new Date(),
      engagement: 50,
    },
  ];

  const deduped = deduplicateNews.deduplicateNews(normalizedNews, 85);

  logger.info(`Original: ${normalizedNews.length}, Deduplicated: ${deduped.length}`);
  deduped.forEach(news => {
    logger.info(`✓ "${news.title}"`);
  });
};

/**
 * Run All Tests
 */
const runAllTests = async () => {
  logger.info('='.repeat(60));
  logger.info('🧪 LINKFORGE SERVICES TEST SUITE');
  logger.info('='.repeat(60));

  try {
    await testSimilarity();
    logger.info('');

    await testTokens();
    logger.info('');

    await testGroqConnection();
    logger.info('');

    await testPostGeneration();
    logger.info('');

    await testRanking();
    logger.info('');

    await testDeduplication();
    logger.info('');

    logger.info('='.repeat(60));
    logger.info('✅ Test suite completed');
    logger.info('='.repeat(60));
  } catch (error) {
    logger.error('Test suite failed', error.message);
  }

  process.exit(0);
};

// Run tests
runAllTests();
