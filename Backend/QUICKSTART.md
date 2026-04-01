# LinkForge Backend - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```

### Step 2: Setup Environment
```bash
cp .env.example .env
# Edit .env and add your API keys:
# - GROQ_API_KEY (from console.groq.com)
# - EMAIL credentials (Gmail app password)
# - MONGODB_URI (local or Atlas)
```

### Step 3: Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Step 4: Verify Installation
Open browser and visit:
```
http://localhost:5000/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Step 5: Test Daily Pipeline
In development mode, you can manually trigger the pipeline:
```
http://localhost:5000/dev/run-daily-job
```

This will:
1. Fetch news from multiple sources
2. Rank by relevance
3. Generate LinkedIn posts with AI
4. Send email with digest
5. Return detailed results

---

## 📁 Project Structure Explained

```
Backend/
├── src/
│   ├── config/
│   │   ├── env.js              # Environment variables & validation
│   │   ├── db.js               # MongoDB connection setup
│   │   └── constants.js        # App-wide constants & weights
│   │
│   ├── services/               # Core business logic ⭐
│   │   ├── news/
│   │   │   ├── fetchNews.js        # Aggregates from multiple sources
│   │   │   ├── normalizeNews.js    # Converts to consistent format
│   │   │   ├── deduplicate.js      # Removes similar articles
│   │   │   └── rankNews.js         # Scores by relevance
│   │   │
│   │   ├── ai/
│   │   │   └── generatePost.js    # Groq API integration
│   │   │
│   │   ├── email/
│   │   │   └── sendDigest.js      # Email generation & sending
│   │   │
│   │   └── post/
│   │       └── createPost.js      # Post CRUD operations
│   │
│   ├── controllers/            # HTTP request handlers
│   │   └── postController.js   # Endpoint logic
│   │
│   ├── routes/                 # API endpoint definitions
│   │   └── postRoutes.js       # Route mappings
│   │
│   ├── models/                 # Database schemas
│   │   └── Post.js             # Post document structure
│   │
│   ├── cron/                   # Scheduled tasks
│   │   ├── dailyJob.js         # Pipeline orchestration
│   │   └── index.js            # Cron job registry
│   │
│   ├── utils/                  # Helper functions
│   │   ├── logger.js           # Logging utility
│   │   ├── tokenManager.js     # JWT token generation
│   │   └── similarity.js       # String similarity (dedup)
│   │
│   ├── app.js                  # Express app setup
│   └── server.js               # Server entry point
│
├── scripts/
│   └── testServices.js         # Test individual services
│
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies & scripts
├── README.md                   # Full documentation
├── QUICKSTART.md               # This file
└── API_EXAMPLES.js             # API usage examples
```

### Key Directories

**`src/services/`** - Where the magic happens
- Each service module is independent and testable
- Services don't depend on Express/HTTP
- Easy to reuse in other projects

**`src/cron/`** - Automated pipeline
- `dailyJob.js`: Orchestrates the entire workflow
- Runs once daily (configurable)

**`src/utils/`** - Reusable helpers
- `similarity.js`: Uses Levenshtein distance for deduplication
- `tokenManager.js`: JWT token lifecycle management

---

## 🔌 API Endpoints Quick Reference

### Public (from email links)
```
GET /post?id=POSTID&token=TOKEN    → Publish post
GET /skip?id=POSTID&token=TOKEN    → Skip post
```

### Protected (requires API key)
```
GET /posts?key=APIKEY              → Get today's posts
GET /stats?key=APIKEY              → Get statistics
GET /skip-all?key=APIKEY           → Skip all posts
```

### Utility
```
GET /health                        → Server status
GET /dev/run-daily-job             → Trigger pipeline (dev only)
```

See `API_EXAMPLES.js` for detailed examples.

---

## 🔐 Configuration Checklist

### Required (won't work without these)
- [ ] `GROQ_API_KEY` - From https://console.groq.com
- [ ] `EMAIL_SENDER` + `EMAIL_PASSWORD` - Gmail with app password
- [ ] `MONGODB_URI` - Local or MongoDB Atlas

### Recommended
- [ ] `ADMIN_API_KEY` - Change from default
- [ ] `TOKEN_SECRET` - Change from default
- [ ] `EMAIL_RECIPIENT` - Your email address
- [ ] `CRON_SCHEDULE` - When to run daily job

### Optional
- [ ] `NEWS_API_KEY` - For expanded news sources
- [ ] `PRODUCT_HUNT_API_KEY` - Product Hunt integration

---

## 🧪 Testing Services

Run individual service tests:
```bash
node scripts/testServices.js
```

Tests:
1. String similarity algorithm
2. JWT token generation
3. Groq API connection
4. Sample post generation
5. News ranking algorithm
6. Deduplication

---

## 📊 Daily Pipeline Walkthrough

When cron job runs (default: 8 AM daily):

```
1. FETCH 📡
   └─ Hacker News, Dev.to, Product Hunt, RSS
   └─ Collects ~45 articles

2. NORMALIZE 🔄
   └─ Converts diverse formats to standard schema
   └─ Extracts: title, URL, source, engagement

3. DEDUPLICATE 🔄
   └─ Uses Levenshtein distance (85% similarity threshold)
   └─ Removes duplicates, keeps highest engagement

4. RANK 📊
   └─ Score formula: 25% recency + 35% engagement + 40% keywords
   └─ Selects top 12 articles

5. GROUP 📚
   └─ Groups similar articles by topic
   └─ Selects best from each group (max 4)

6. GENERATE 🤖
   └─ Groq API: Creates LinkedIn post per group
   └─ Format: Hook + 3-5 lines + outlook + hashtags

7. STORE 💾
   └─ MongoDB: Saves posts as "pending"
   └─ Generates JWT tokens (24-hour expiry)

8. EMAIL 📧
   └─ HTML digest with posts + buttons
   └─ "Post Now" and "Skip" links with tokens
```

Total time: ~20-30 seconds

---

## 🐛 Common Issues & Solutions

### "GROQ_API_KEY not configured"
```
✓ Set GROQ_API_KEY in .env
✓ Get key from https://console.groq.com
✓ Restart server after adding key
```

### "Failed to send email"
```
✓ Verify Gmail credentials in .env
✓ Use app password, not regular password
✓ Enable 2FA on Gmail account
✓ Check EMAIL_SENDER matches Gmail address
```

### "MongoDB connection failed"
```
✓ Start MongoDB: mongod
✓ Check MONGODB_URI syntax
✓ Verify MongoDB is accessible
✓ Use MongoDB Atlas for cloud hosting
```

### "No posts created"
```
✓ Check server logs for errors
✓ Verify all API keys are valid
✓ Run /dev/run-daily-job to see detailed errors
✓ Check MongoDB has storage available
```

---

## 📚 Key Concepts

### Scoring Algorithm
Posts are ranked by three factors:
- **Recency** (25%): Recent articles score higher, decay over 48 hours
- **Engagement** (35%): Comments + votes (log scale to prevent outliers)
- **Keywords** (40%): Boost for AI, security, startup, etc.

### String Similarity
Uses **Levenshtein distance** algorithm:
- Measures minimum edits (insert, delete, replace) to transform string A to B
- 85% threshold = "GPT-5 Breakthrough" matches "GPT-5 Released"

### Token Security
- JWT tokens encode post ID + timestamp
- Expires in 24 hours
- Verified before publishing
- Prevents replay attacks

---

## 🚢 Deployment to Production

### Pre-deployment Checklist
- [ ] Change `TOKEN_SECRET` in .env
- [ ] Change `ADMIN_API_KEY` in .env
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas (not localhost)
- [ ] Enable HTTPS/SSL
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Configure strong email passwords
- [ ] Monitor Groq API usage and costs
- [ ] Setup proper error monitoring/logging

### Deploy Steps (example with Heroku)
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set GROQ_API_KEY=xxx
heroku config:set MONGODB_URI=xxx
# ... set all other vars

# Push to Heroku
git push heroku main

# View logs
heroku logs --tail
```

---

## 📖 Learning Path

1. **Start**: Read this file + README.md
2. **Explore**: Look at `src/services/` - each module is independent
3. **Understand**: Check `src/cron/dailyJob.js` - the orchestrator
4. **Test**: Run `scripts/testServices.js` - see services in action
5. **Integrate**: Check `src/app.js` and `src/routes/` - HTTP layer
6. **Deploy**: Follow deployment section above

---

## 🤝 Contributing

To extend LinkForge:

1. **Add new news source**: Extend `src/services/news/fetchNews.js`
2. **Custom ranking**: Modify weights in `src/config/constants.js`
3. **Better AI prompts**: Update prompt in `src/services/ai/generatePost.js`
4. **New endpoints**: Add to `src/routes/postRoutes.js` and `src/controllers/`

All changes should:
- Follow existing code style
- Include error handling
- Add logging via `logger`
- Be tested before deployment

---

## 📞 Support

**Errors**: Check server logs (visible in terminal)
**Questions**: Review architecture in `src/` directory structure
**Ideas**: Check Future Enhancements in README.md

---

## 📝 What Happens Next?

Once properly configured:

1. **Daily**: Cron job runs at 8 AM (configurable)
2. **Fetches**: News from Hacker News, Dev.to, Product Hunt
3. **Ranks**: By relevance and engagement
4. **Generates**: LinkedIn posts with Groq AI
5. **Emails**: You get daily digest with one-click publishing
6. **Tracks**: All published posts in MongoDB

You can also:
- Skip posts via email ("Skip" button)
- Get stats on clicked/published posts
- Manually trigger job via `/dev/run-daily-job` (dev mode)
- View all pending posts via `/posts?key=...` (admin)

---

**Happy posting! 🚀**

Built with ❤️ using Node.js, Express, MongoDB, and Groq AI
