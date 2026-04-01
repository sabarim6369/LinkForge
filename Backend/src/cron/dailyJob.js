/**
 * Daily Cron Job
 * Orchestrates the complete LinkForge pipeline
 * Steps: Fetch → Normalize → Deduplicate → Rank → Generate → Store → Email
 */

const logger = require('../../utils/logger');

// Import services
const { fetchAllNews } = require('../../services/news/fetchNews');
const { normalizeAllNews } = require('../../services/news/normalizeNews');
const { deduplicateNews, groupSimilarNews, selectBestFromGroups } = require('../../services/news/deduplicate');
const { rankNews, getTopNews } = require('../../services/news/rankNews');
const { generateMultiplePosts } = require('../../services/ai/generatePost');
const postService = require('../../services/post/createPost');
const { sendEmailDigest } = require('../../services/email/sendDigest');

/**
 * Execute the complete daily pipeline
 * This is called once per day by node-cron
 * @returns {Promise<object>} Execution result with stats
 */
const executeDailyJob = async () => {
  const startTime = Date.now();
  let result = {
    success: false,
    timestamp: new Date().toISOString(),
    pipelineSteps: {},
    stats: {
      newsCollected: 0,
      newsNormalized: 0,
      newsDeduplicated: 0,
      newsRanked: 0,
      postsGenerated: 0,
      emailsSent: false,
    },
  };

  try {
    logger.info('🚀 ===== STARTING LINKFORGE DAILY PIPELINE =====');

    // ============================================================
    // STEP 1: FETCH NEWS FROM ALL SOURCES
    // ============================================================
    logger.info('📡 STEP 1: Fetching news from all sources...');
    const rawNews = await fetchAllNews();
    result.stats.newsCollected = rawNews.length;
    result.pipelineSteps.fetch = {
      status: 'completed',
      itemsCollected: rawNews.length,
    };

    if (rawNews.length === 0) {
      throw new Error('No news items collected from any source');
    }

    // ============================================================
    // STEP 2: NORMALIZE DATA
    // ============================================================
    logger.info('🔄 STEP 2: Normalizing news data...');
    const normalizedNews = await normalizeAllNews(rawNews);
    result.stats.newsNormalized = normalizedNews.length;
    result.pipelineSteps.normalize = {
      status: 'completed',
      itemsNormalized: normalizedNews.length,
    };

    if (normalizedNews.length === 0) {
      throw new Error('No news items normalized');
    }

    // ============================================================
    // STEP 3: DEDUPLICATE
    // ============================================================
    logger.info('🔄 STEP 3: Deduplicating similar news...');
    const dedupNews = deduplicateNews(normalizedNews, 85);
    result.stats.newsDeduplicated = dedupNews.length;
    result.pipelineSteps.deduplicate = {
      status: 'completed',
      itemsAfterDedup: dedupNews.length,
      itemsRemoved: normalizedNews.length - dedupNews.length,
    };

    // ============================================================
    // STEP 4: RANK NEWS
    // ============================================================
    logger.info('📊 STEP 4: Ranking news by relevance...');
    const rankedNews = rankNews(dedupNews);
    const topNews = getTopNews(rankedNews, 12); // Get top 12 for grouping
    result.stats.newsRanked = topNews.length;
    result.pipelineSteps.rank = {
      status: 'completed',
      topNewsSelected: topNews.length,
      topScores: topNews.slice(0, 3).map(n => ({ title: n.title, score: n.score })),
    };

    // ============================================================
    // STEP 5: GROUP SIMILAR ARTICLES
    // ============================================================
    logger.info('📚 STEP 5: Grouping similar articles...');
    const newsGroups = groupSimilarNews(topNews, 75);
    const bestFromEachGroup = selectBestFromGroups(newsGroups);
    const articlesToUse = bestFromEachGroup.slice(0, 4); // Use top 4 groups max
    result.pipelineSteps.group = {
      status: 'completed',
      groupsCreated: newsGroups.length,
      articlesSelected: articlesToUse.length,
    };

    if (articlesToUse.length === 0) {
      throw new Error('No articles selected for post generation');
    }

    // ============================================================
    // STEP 6: GENERATE POSTS WITH AI
    // ============================================================
    logger.info('🤖 STEP 6: Generating LinkedIn posts with Groq AI...');
    
    // Create groups of 2-3 articles per post
    const postGroups = [];
    for (let i = 0; i < articlesToUse.length; i += 2) {
      const group = articlesToUse.slice(i, Math.min(i + 2, articlesToUse.length));
      postGroups.push(group);
    }

    const generatedPosts = await generateMultiplePosts(postGroups);
    result.stats.postsGenerated = generatedPosts.length;
    result.pipelineSteps.aiGeneration = {
      status: 'completed',
      postsGenerated: generatedPosts.length,
    };

    if (generatedPosts.length === 0) {
      throw new Error('Failed to generate any posts');
    }

    // ============================================================
    // STEP 7: STORE POSTS IN DATABASE
    // ============================================================
    logger.info('💾 STEP 7: Storing posts in MongoDB...');
    const createdPosts = await postService.createPosts(generatedPosts);
    result.pipelineSteps.storage = {
      status: 'completed',
      postsStored: createdPosts.length,
      postIds: createdPosts.map(p => p._id),
    };

    if (createdPosts.length === 0) {
      throw new Error('Failed to store posts in database');
    }

    // ============================================================
    // STEP 8: SEND EMAIL DIGEST
    // ============================================================
    logger.info('📧 STEP 8: Sending email digest...');
    
    // Prepare posts with tokens for email
    const postsForEmail = createdPosts.map(post => ({
      ...post.toObject(),
      token: post.token || 'token-not-generated',
    }));

    const emailSent = await sendEmailDigest(postsForEmail);
    result.pipelineSteps.email = {
      status: emailSent ? 'completed' : 'failed',
      emailSent,
    };

    // ============================================================
    // COMPLETE
    // ============================================================
    result.success = true;
    const duration = Math.round((Date.now() - startTime) / 1000);
    result.duration = `${duration}s`;

    logger.info('✅ ===== LINKFORGE DAILY PIPELINE COMPLETED SUCCESSFULLY =====');
    logger.info(`📊 Summary: ${result.stats.newsCollected} news → ${result.stats.postsGenerated} posts → Email sent`);
    logger.info(`⏱️ Total execution time: ${duration} seconds`);

    return result;
  } catch (error) {
    logger.error('❌ PIPELINE FAILED', error.message);
    result.error = error.message;
    result.pipelineSteps.error = {
      status: 'failed',
      message: error.message,
    };

    const duration = Math.round((Date.now() - startTime) / 1000);
    result.duration = `${duration}s`;

    return result;
  }
};

module.exports = {
  executeDailyJob,
};
