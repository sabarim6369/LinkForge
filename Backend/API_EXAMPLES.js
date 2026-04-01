/**
 * API Usage Examples
 * Quick reference for testing endpoints
 */

// ============================================================
// ENVIRONMENT SETUP
// ============================================================
// Before testing, ensure:
// 1. Start server: npm run dev
// 2. MongoDB is running
// 3. .env file configured with API keys
// Server will run on http://localhost:5000

// ============================================================
// 1. HEALTH CHECK
// ============================================================

/**
 * Check if server is running
 */
async function healthCheck() {
  const response = await fetch('http://localhost:5000/health');
  const data = await response.json();
  console.log('Server Status:', data);
  // Output: { success: true, message: 'Server is running', timestamp: '...' }
}

// Test with curl:
// curl http://localhost:5000/health

// ============================================================
// 2. PUBLISH A POST (from email link)
// ============================================================

/**
 * Publish a post using ID and token
 * This would be triggered from email link
 */
async function publishPost(postId, token) {
  const url = `http://localhost:5000/post?id=${postId}&token=${token}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log('Publish Result:', data);
  // Output: { success: true, message: 'Post published successfully!', data: { postId, status: 'posted', postedAt } }
}

// Test with curl:
// curl "http://localhost:5000/post?id=ACTUAL_POST_ID&token=ACTUAL_JWT_TOKEN"

// ============================================================
// 3. SKIP A POST (from email link)
// ============================================================

/**
 * Skip a post using ID and token
 */
async function skipPost(postId, token) {
  const url = `http://localhost:5000/skip?id=${postId}&token=${token}`;

  const response = await fetch(url);
  const data = await response.json();
  console.log('Skip Result:', data);
  // Output: { success: true, message: 'Post skipped successfully', data: { postId, status: 'skipped' } }
}

// Test with curl:
// curl "http://localhost:5000/skip?id=ACTUAL_POST_ID&token=ACTUAL_JWT_TOKEN"

// ============================================================
// 4. GET TODAY'S POSTS (Protected)
// ============================================================

/**
 * Get all pending posts from today
 * Requires ADMIN_API_KEY
 */
async function getTodaysPosts(adminApiKey) {
  const response = await fetch(
    `http://localhost:5000/posts?key=${adminApiKey}`
  );
  const data = await response.json();
  console.log('Today\'s Posts:', data);
  // Output: { success: true, data: { count: 4, posts: [...] } }
}

// Test with curl:
// curl "http://localhost:5000/posts?key=YOUR_ADMIN_API_KEY"

// With header:
// curl -H "x-api-key: YOUR_ADMIN_API_KEY" http://localhost:5000/posts

// ============================================================
// 5. GET STATISTICS (Protected)
// ============================================================

/**
 * Get post statistics
 * Shows count by status: pending, posted, skipped
 */
async function getStats(adminApiKey) {
  const response = await fetch(
    `http://localhost:5000/stats?key=${adminApiKey}`
  );
  const data = await response.json();
  console.log('Statistics:', data);
  // Output: { success: true, data: { pending: 4, posted: 12, skipped: 3, total: 19 } }
}

// Test with curl:
// curl "http://localhost:5000/stats?key=YOUR_ADMIN_API_KEY"

// ============================================================
// 6. SKIP ALL POSTS (Protected)
// ============================================================

/**
 * Skip all pending posts from today
 */
async function skipAllPosts(adminApiKey) {
  const response = await fetch(
    `http://localhost:5000/skip-all?key=${adminApiKey}`
  );
  const data = await response.json();
  console.log('Skip All Result:', data);
  // Output: { success: true, message: 'Skipped X posts', data: { skippedCount: X } }
}

// Test with curl:
// curl "http://localhost:5000/skip-all?key=YOUR_ADMIN_API_KEY"

// ============================================================
// 7. MANUAL CRON TRIGGER (Dev only)
// ============================================================

/**
 * Manually trigger the daily pipeline
 * Only available in development mode
 */
async function triggerDailyJob() {
  const response = await fetch('http://localhost:5000/dev/run-daily-job');
  const data = await response.json();
  console.log('Daily Job Result:', data);
  /* Output example:
  {
    success: true,
    timestamp: '2024-01-15T10:30:00Z',
    pipelineSteps: {
      fetch: { status: 'completed', itemsCollected: 45 },
      normalize: { status: 'completed', itemsNormalized: 45 },
      deduplicate: { status: 'completed', itemsAfterDedup: 38 },
      rank: { status: 'completed', topNewsSelected: 12 },
      group: { status: 'completed', groupsCreated: 6, articlesSelected: 4 },
      aiGeneration: { status: 'completed', postsGenerated: 4 },
      storage: { status: 'completed', postsStored: 4 },
      email: { status: 'completed', emailSent: true }
    },
    stats: { newsCollected: 45, newsNormalized: 45, newsDeduplicated: 38, newsRanked: 12, postsGenerated: 4, emailsSent: true },
    duration: '23s'
  }
  */
}

// Test with curl:
// curl http://localhost:5000/dev/run-daily-job

// ============================================================
// COMPLETE TEST WORKFLOW
// ============================================================

/**
 * Complete workflow example
 */
async function completeWorkflow() {
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'your_admin_api_key';

  console.log('\n=== LINKFORGE API TEST WORKFLOW ===\n');

  try {
    // 1. Check server health
    console.log('1️⃣ Checking server health...');
    await healthCheck();

    // 2. Get current statistics
    console.log('\n2️⃣ Getting current statistics...');
    await getStats(ADMIN_API_KEY);

    // 3. Get today's posts
    console.log('\n3️⃣ Getting today\'s posts...');
    await getTodaysPosts(ADMIN_API_KEY);

    // 4. Manually trigger daily job
    console.log('\n4️⃣ Triggering daily job (may take 20-30 seconds)...');
    await triggerDailyJob();

    // 5. Get updated statistics
    console.log('\n5️⃣ Getting updated statistics...');
    await getStats(ADMIN_API_KEY);

    console.log('\n✅ Workflow completed!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run workflow:
// node scripts/apiExamples.js

// ============================================================
// CURL COMMAND REFERENCE
// ============================================================

/*
# Health Check
curl http://localhost:5000/health

# Get Today's Posts
curl "http://localhost:5000/posts?key=YOUR_ADMIN_API_KEY"

# Get Statistics
curl "http://localhost:5000/stats?key=YOUR_ADMIN_API_KEY"

# Skip All Posts
curl "http://localhost:5000/skip-all?key=YOUR_ADMIN_API_KEY"

# Run Daily Job (Dev)
curl http://localhost:5000/dev/run-daily-job

# Publish Post (from email)
curl "http://localhost:5000/post?id=POSTID&token=TOKEN"

# Skip Post (from email)
curl "http://localhost:5000/skip?id=POSTID&token=TOKEN"

# With custom headers
curl -H "x-api-key: YOUR_ADMIN_API_KEY" http://localhost:5000/posts
*/

// Export for Node.js
module.exports = {
  healthCheck,
  publishPost,
  skipPost,
  getTodaysPosts,
  getStats,
  skipAllPosts,
  triggerDailyJob,
  completeWorkflow,
};

// Run example if executed directly
if (require.main === module) {
  completeWorkflow().catch(console.error);
}
