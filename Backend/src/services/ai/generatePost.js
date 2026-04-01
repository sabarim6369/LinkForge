/**
 * Generate Post Service
 * Uses Groq API to generate LinkedIn-style posts from news articles
 */

const fetch = require('node-fetch');
const config = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Generate a LinkedIn-style post from a news article
 * Uses Groq API (fast, cost-effective LLM)
 * @param {Array<object>} newsItems - Array of news items to generate post from
 * @returns {Promise<string|null>} Generated post content or null on failure
 */
const generatePost = async (newsItems) => {
  try {
    if (!newsItems || newsItems.length === 0) {
      throw new Error('No news items provided');
    }

    if (!config.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Build context from all news items
    const newsContext = newsItems
      .map(
        (item, idx) =>
          `${idx + 1}. Title: "${item.title}"\n   Source: ${item.source}\n   URL: ${item.url}\n   Engagement: ${item.engagement}`
      )
      .join('\n\n');

    const prompt = `You are a professional LinkedIn content creator specializing in tech industry insights.

Based on these trending tech news items:
${newsContext}

Generate a compelling LinkedIn post that:
1. Opens with a strong hook or observation
2. Synthesizes insights from these articles (3-5 lines)
3. Includes a personal perspective ("My take:")
4. Ends with 3-5 relevant hashtags
5. Maintains professional but conversational tone
6. Is suitable for sharing with tech professionals

The post should be concise (300-400 characters including hashtags) and engaging.`;

    const payload = {
      model: config.GROQ_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      top_p: 0.9,
    };

    logger.debug('Calling Groq API for post generation...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 15000,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Unexpected Groq API response format');
    }

    const generatedPost = data.choices[0].message.content.trim();

    logger.info(`✅ Generated post from ${newsItems.length} news items`);
    logger.debug(`Generated content: ${generatedPost.substring(0, 100)}...`);

    return generatedPost;
  } catch (error) {
    logger.error('Post generation failed', error.message);
    return null;
  }
};

/**
 * Generate posts from multiple news groups
 * Each group gets its own LinkedIn post
 * @param {Array<Array>} newsGroups - Array of news item groups
 * @returns {Promise<Array>} Generated posts with metadata
 */
const generateMultiplePosts = async (newsGroups) => {
  try {
    const posts = [];

    for (const group of newsGroups) {
      const content = await generatePost(group);

      if (content) {
        posts.push({
          content,
          sourceTitles: group.map(item => item.title),
          sourceUrls: group.map(item => item.url),
          sources: group.map(item => item.source),
          score: Math.round(group.reduce((sum, item) => sum + (item.score || 0), 0) / group.length),
          status: 'pending',
        });
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`🎉 Generated ${posts.length} posts from ${newsGroups.length} news groups`);
    return posts;
  } catch (error) {
    logger.error('Multiple post generation failed', error.message);
    return [];
  }
};

/**
 * Test Groq API connection
 * Useful for debugging configuration issues
 * @returns {Promise<boolean>} True if API is accessible
 */
const testGroqConnection = async () => {
  try {
    if (!config.GROQ_API_KEY) {
      logger.error('Groq API key not configured');
      return false;
    }

    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.GROQ_API_KEY}`,
      },
      timeout: 5000,
    });

    if (response.ok) {
      logger.info('✅ Groq API connection successful');
      return true;
    } else {
      logger.error(`Groq API test failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error('Groq API test error', error.message);
    return false;
  }
};

module.exports = {
  generatePost,
  generateMultiplePosts,
  testGroqConnection,
};
