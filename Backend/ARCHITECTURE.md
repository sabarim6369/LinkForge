/**
 * LinkForge Architecture Overview
 * This document explains the system design and data flow
 */

// ============================================================
// SYSTEM ARCHITECTURE
// ============================================================
/*
┌─────────────────────────────────────────────────────────────────┐
│                       LINKFORGE SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📅 SCHEDULER (node-cron)                                      │
│  └─► Runs daily job at 8 AM (configurable)                     │
│                                                                 │
│  🔄 DAILY PIPELINE (orchestrated by src/cron/dailyJob.js)    │
│  ┌──────────────────────────────────────────────────────────   │
│  │                                                              │
│  ├─► [1] FETCH 📡                                              │
│  │   ├─ Hacker News API                                        │
│  │   ├─ Dev.to API                                             │
│  │   ├─ Product Hunt API                                       │
│  │   └─ RSS Feed Reader                                        │
│  │   Output: ~45 raw news items                                │
│  │                                                              │
│  ├─► [2] NORMALIZE 🔄                                          │
│  │   └─ Convert diverse formats to standard schema             │
│  │   Output: Consistent news structure                         │
│  │                                                              │
│  ├─► [3] DEDUPLICATE 🔄                                        │
│  │   └─ Remove similar articles (85% threshold)               │
│  │   Output: ~38 unique articles                               │
│  │                                                              │
│  ├─► [4] RANK 📊                                               │
│  │   ├─ Recency score (25%)                                    │
│  │   ├─ Engagement score (35%)                                 │
│  │   └─ Keyword boost (40%)                                    │
│  │   Output: Top 12 ranked articles                            │
│  │                                                              │
│  ├─► [5] GROUP 📚                                              │
│  │   └─ Group by topic similarity, select best                │
│  │   Output: 4 topic groups                                    │
│  │                                                              │
│  ├─► [6] GENERATE 🤖                                           │
│  │   └─ Groq API: Create LinkedIn post per group              │
│  │   Output: 4 AI-generated posts                              │
│  │                                                              │
│  ├─► [7] STORE 💾                                              │
│  │   ├─ MongoDB: Save posts (status: pending)                  │
│  │   ├─ Generate JWT tokens (24h expiry)                       │
│  │   └─ Link to source articles                                │
│  │   Output: 4 posts in database                               │
│  │                                                              │
│  ├─► [8] EMAIL 📧                                              │
│  │   ├─ Generate HTML digest                                   │
│  │   ├─ "Post Now" buttons with tokens                         │
│  │   └─ Send via Nodemailer                                    │
│  │   Output: Email delivered                                   │
│  │                                                              │
│  └─► ✅ DONE (Duration: 20-30 seconds)                        │
│                                                                 │
│  🔗 API ENDPOINTS                                              │
│  ├─ GET /post?id=X&token=Y      (from email "Post Now")       │
│  │   └─► Mark post as published                               │
│  ├─ GET /skip?id=X&token=Y      (from email "Skip")           │
│  │   └─► Mark post as skipped                                 │
│  ├─ GET /posts?key=K            (admin) Get pending posts     │
│  ├─ GET /stats?key=K            (admin) Get statistics         │
│  └─ GET /skip-all?key=K         (admin) Skip all today's      │
│                                                                 │
│  💾 DATABASE (MongoDB)                                         │
│  └─ posts: {                                                   │
│     content (AI-generated text)                                │
│     sourceTitles, sourceUrls, sources                          │
│     status: pending|posted|skipped                             │
│     score, createdAt, postedAt                                 │
│     tokenExpiredAt, emailSentAt, ...                           │
│   }                                                             │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
*/

// ============================================================
// DATA FLOW DETAILED
// ============================================================

/*
INPUT (Raw News)
│
├─ Hacker News:        { by, title, score, descendants, url, time, ... }
├─ Dev.to:             { user, title, positive_reactions_count, url, ... }
├─ Product Hunt:       { name, votes_count, url, created_at, ... }
└─ RSS:                { title, link, pubDate, ... }
│
▼
NORMALIZE
│
├─ Extract common fields: title, url, source, publishedAt
├─ Calculate engagement: score + comments * 0.5
└─ Generate sourceId for tracking
│
▼ Normalized News
│ { title, url, source, publishedAt, engagement, sourceId, rawData }
│
▼
DEDUPLICATE (String Similarity)
│
├─ For each pair: Compare title similarity (Levenshtein distance)
├─ If similarity > 85%: Mark as duplicate
└─ Keep highest engagement from each group
│
▼ Deduplicated News
│
▼
RANK (Scoring Algorithm)
│
├─ Score = 0.25*recency + 0.35*engagement + 0.40*keyword
├─ Recency: 100 at 0-6hrs, decay to 0 by 48hrs
├─ Engagement: Log scale (1-1000) normalized to 0-100
├─ Keyword: Boost for AI, security, startup, etc.
└─ Top 12 by score
│
▼ Ranked News
│
▼
GROUP (Topic Clustering)
│
├─ Use string similarity to group related articles
├─ Select best from each group (highest engagement)
└─ Result: 4 topic groups
│
▼ Article Groups: [Group1[articles], Group2[articles], ...]
│
▼
GENERATE (Groq AI)
│
├─ For each group: Send articles to Groq
├─ Prompt: "Create LinkedIn post from these articles"
├─ Receive: Hook + summary + insight + hashtags (~300-400 chars)
└─ 4 Posts: [Post1, Post2, Post3, Post4]
│
▼ Generated Posts
│
▼
STORE (MongoDB)
│
├─ Insert each post with:
│   - content (AI text)
│   - sourceTitles (source articles)
│   - score (average of source articles)
│   - status: "pending"
│   - createdAt: now
│   - tokenExpiredAt: now + 24h
├─ Generate JWT token: { postId, createdAt }
└─ Token expires in 24 hours
│
▼ Stored Posts (in MongoDB)
│
▼
EMAIL (Nodemailer)
│
├─ Build HTML template
├─ For each post:
│   - Content
│   - "Post Now" button with token
│   - "Skip" button with token
│   - Source information
├─ Send via Gmail/other service
└─ Mark emailSentAt in database
│
▼ Email Delivered to User's Inbox
│
▼
NEXT: USER INTERACTION (Email)
│
├─ User opens email
├─ Clicks "Post Now" → GET /post?id=X&token=JWT
│   - Verify JWT token
│   - Check token expiry (24h limit)
│   - Mark post status: "posted"
│   - Update postedAt timestamp
│   - Respond with success
│
└─ Or clicks "Skip" → GET /skip?id=X&token=JWT
   - Verify JWT token
   - Mark post status: "skipped"
   - Update skippedAt timestamp
   - Respond with success

OUTPUT: LinkedIn posts published, email digest sent, database updated
*/

// ============================================================
// SERVICE MODULES DEPENDENCY GRAPH
// ============================================================

/*
                    dailyJob.js (Orchestrator)
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼
        fetchNews    normalizeNews       postController
                          │                  ▲
            ┌─────────────┼────────────┐    │
            │             │            │    │
            ▼             ▼            ▼    │
        deduplicate   rankNews    generatePost
            │                           │
            └─────────────┬─────────────┘
                          │
                          ▼
                       sendDigest
                          │
                          ▼
                       createPost
                          │
                          ▼
                       MongoDB

Utilities (used by all):
- logger.js          (logging)
- tokenManager.js    (JWT generation/verification)
- similarity.js      (string comparison)
*/

// ============================================================
// REQUEST/RESPONSE EXAMPLES
// ============================================================

/*
REQUEST 1: User clicks "Post Now" from email
─────────────────────────────────────────
GET /post?id=507f1f77bcf86cd799439011&token=eyJhbGciOiJIUzI1NiIs...

RESPONSE:
{
  "success": true,
  "message": "Post published successfully!",
  "data": {
    "postId": "507f1f77bcf86cd799439011",
    "status": "posted",
    "postedAt": "2024-01-15T14:30:00Z"
  }
}

DATABASE CHANGE:
Post.status: "pending" → "posted"
Post.postedAt: null → "2024-01-15T14:30:00Z"


REQUEST 2: Admin checks today's posts
──────────────────────────────────────
GET /posts?key=your_admin_api_key

RESPONSE:
{
  "success": true,
  "data": {
    "count": 4,
    "posts": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "content": "🚀 Just saw this amazing breakthrough...",
        "status": "pending",
        "score": 85,
        "createdAt": "2024-01-15T08:15:00Z",
        "sourceTitles": ["OpenAI releases GPT-5", "..."],
        "sources": ["techcrunch", "hackernews"]
      },
      ...
    ]
  }
}


REQUEST 3: Get statistics
──────────────────────────
GET /stats?key=your_admin_api_key

RESPONSE:
{
  "success": true,
  "data": {
    "pending": 2,
    "posted": 12,
    "skipped": 5,
    "total": 19
  }
}
*/

// ============================================================
// ERROR HANDLING FLOW
// ============================================================

/*
If any step fails:

1. FETCH FAILS (no internet, API down)
   - Log error
   - Job continues (graceful degradation)
   - Result: "No posts generated today"

2. NORMALIZE FAILS (unexpected API format)
   - Skip the problematic item
   - Log warning
   - Continue with others

3. DEDUPLICATE FAILS (algorithm error)
   - Still produces results (degrades to no dedup)
   - Logs warning

4. RANK FAILS (scoring error)
   - Fallback to original order
   - Logs error

5. GENERATE FAILS (Groq API error)
   - Check API key
   - Check API usage limits
   - Retry up to 2 times
   - Log detailed error

6. STORE FAILS (MongoDB error)
   - Critical - stops pipeline
   - Returns error to cron
   - Logs to console

7. EMAIL FAILS (SMTP error)
   - Check email credentials
   - Check inbox limits
   - Log error (doesn't stop pipeline)
   - Posts still in database

All errors logged with:
- Timestamp
- Function name
- Error message
- Relevant data
*/

// ============================================================
// SECURITY CONSIDERATIONS
// ============================================================

/*
1. JWT TOKENS (Email Links)
   ────────────────────────
   ✓ Signed with SECRET_KEY (in .env)
   ✓ Contains: { postId, createdAt, exp }
   ✓ Expires: 24 hours from creation
   ✓ Verified before action
   ✓ Prevents: Replay attacks, token forgery

2. API KEY PROTECTION
   ──────────────────
   ✓ ADMIN_API_KEY in environment
   ✓ Checked before admin endpoints
   ✓ Can be passed as query param or header
   ✓ Not logged in plaintext

3. DATABASE
   ────────
   ✓ Mongoose auto-protects from injection
   ✓ ObjectId validation on all queries
   ✓ No raw SQL/MongoDB commands

4. INPUT VALIDATION
   ────────────────
   ✓ Email validation on recipient
   ✓ URL validation on news links
   ✓ Title length limits (min 10, max 500)

5. RATE LIMITING
   ──────────────
   ⚠ Not implemented - add for production
   Recommendations:
   - 100 requests/hour per IP for public endpoints
   - 1000 requests/hour for admin endpoints
   - Groq API: Monitor usage to avoid overage charges

6. LOGGING
   ───────
   ✓ No sensitive data logged
   ✓ API keys/passwords never logged
   ✓ Tokens shortened in logs
   ✓ User emails not logged
*/

// ============================================================
// SCALING CONSIDERATIONS
// ============================================================

/*
Current Architecture (Single Server):
────────────────────────────────────
- 1 Node.js process
- 1 MongoDB instance
- Cron job blocked while running

Can handle:
- ~500 emails/day (Groq API limit)
- ~10,000 API requests/day
- ~1M MongoDB documents

For Higher Scale:
────────────────
1. Separate cron to background worker
   - Use Bull (Redis-based job queue)
   - Allow retries on failure
   - Better error handling

2. Database optimization
   - Add indexes on status, createdAt
   - Archive old posts (>30 days)
   - Use database connection pooling

3. Caching
   - Redis: Cache top news of the day
   - Reduce API calls to news sources
   - Cache generated posts temporarily

4. Monitoring
   - Error tracking (Sentry)
   - Performance monitoring (New Relic)
   - Email delivery tracking

5. Horizontal scaling
   - Docker containerization
   - Load balancer (nginx)
   - Multiple worker nodes
   - Centralized job queue

Current implementation is suitable for:
- Startup MVP
- Personal use
- Proof of concept
- Up to 1000 daily emails
*/

// ============================================================
// TESTING STRATEGY
// ============================================================

/*
Unit Tests (Per Service):
─────────────────────────
✓ Similarity algorithm
  - Test exact matches (100%)
  - Test partial matches (>85%)
  - Test no matches (0%)

✓ Ranking algorithm
  - Test recency decay
  - Test engagement scoring
  - Test keyword boost

✓ Token generation
  - Test token creation
  - Test token verification
  - Test expiry validation

Integration Tests:
──────────────────
⚠ Needs socket mocking (APIs)
- Test fetch + normalize flow
- Test dedup + rank flow
- Test complete pipeline

E2E Tests:
──────────
⚠ Requires real API keys + MongoDB
- Test /dev/run-daily-job with real APIs
- Test email delivery
- Test post publishing

Manual Testing:
───────────────
✓ Run scripts/testServices.js
✓ Check /dev/run-daily-job output
✓ Verify email arrives
✓ Click email links
✓ Check MongoDB posts updated
*/

// ============================================================
// DEPLOYMENT CHECKLIST
// ============================================================

/*
Pre-deployment:
✓ Test locally with npm run dev
✓ Run scripts/testServices.js
✓ Check all API keys are valid
✓ Test email sending
✓ Verify cron job runs manually
✓ Check MongoDB connectivity

Environment:
✓ Change TOKEN_SECRET
✓ Change ADMIN_API_KEY
✓ Set NODE_ENV=production
✓ Use MongoDB Atlas (not localhost)
✓ Set CORS_ORIGIN correctly
✓ Enable HTTPS/TLS

Monitoring:
✓ Setup error logging (Sentry, etc)
✓ Monitor Groq API usage
✓ Monitor email sending limits
✓ Setup uptime monitoring
✓ Check server logs daily

Maintenance:
✓ Archive old posts monthly
✓ Monitor database size
✓ Review error logs
✓ Update dependencies quarterly
✓ Test disaster recovery
*/

module.exports = {
  ARCHITECTURE_OVERVIEW: true,
  // This file is for documentation only
};
