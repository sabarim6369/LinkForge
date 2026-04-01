# LinkForge Backend

> AI-powered personal branding assistant that fetches daily tech news, generates LinkedIn posts with Groq AI, and sends personalized email digests.

## Features

- 🔄 **News Aggregation**: Fetches from Hacker News, Dev.to, Product Hunt, and RSS feeds
- 🤖 **AI Post Generation**: Uses Groq API for fast, cost-effective LinkedIn post creation
- 📧 **Email Digests**: Sends daily emails with generated posts and one-click publishing
- 🎯 **Smart Ranking**: Scores news by recency, engagement, and trending keywords
- 🔐 **Secure Tokens**: JWT-based authentication for email links (24-hour expiry)
- 📊 **Full Pipeline**: Automated daily cron job handles entire workflow

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Task Scheduler**: node-cron
- **Email**: Nodemailer
- **AI/LLM**: Groq API
- **Authentication**: JWT (jsonwebtoken)

## Architecture

```
src/
├── config/              # Environment, database, constants
├── services/            # Core business logic
│   ├── news/           # Fetch, normalize, deduplicate, rank
│   ├── ai/             # Groq integration for post generation
│   ├── email/          # Email sending with HTML templates
│   └── post/           # Post CRUD and status management
├── controllers/        # HTTP request handlers
├── routes/             # API endpoint definitions
├── models/             # MongoDB schemas
├── cron/               # Scheduled jobs
├── utils/              # Helpers (logger, tokens, similarity)
├── app.js              # Express configuration
└── server.js           # Entry point
```

## Installation

### Prerequisites

- Node.js 14+ and npm
- MongoDB (local or Atlas)
- Groq API key (free at https://console.groq.com)
- Gmail account with app password (for email)

### Setup Steps

1. **Clone and Install**
   ```bash
   cd Backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start MongoDB**
   ```bash
   # Local: mongod
   # Or use MongoDB Atlas connection string in .env
   ```

4. **Run Server**
   ```bash
   # Production
   npm start

   # Development (with auto-reload)
   npm run dev
   ```

5. **Verify Setup**
   - Health check: `curl http://localhost:5000`
   - View logs in terminal

## Configuration Guide

### Groq API Setup
1. Go to https://console.groq.com
2. Click "Create API Key"
3. Copy key to `GROQ_API_KEY` in `.env`
4. (Optional) Test with: `curl http://localhost:5000/dev/run-daily-job`

### Gmail Setup (Email)
1. Enable 2-factor authentication
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Copy generated password to `EMAIL_PASSWORD` in `.env`
5. Set `EMAIL_SENDER` to your Gmail address

### MongoDB Connection
- **Local**: `mongodb://localhost:27017/linkforge`
- **Atlas**: `mongodb+srv://user:password@cluster.mongodb.net/linkforge`

### Cron Schedule
The default daily job runs at 8 AM. Customize with cron syntax:
```
# Every day at 8 AM
0 8 * * *

# Every 6 hours
0 */6 * * *

# 8:30 AM Monday-Friday
30 8 * * 1-5
```

## API Endpoints

### Public (from Email Links)

**Publish Post**
```
GET /post?id=POST_ID&token=JWT_TOKEN
```
Publishes a post from an email link. Token expires in 24 hours.

**Skip Post**
```
GET /skip?id=POST_ID&token=JWT_TOKEN
```
Skips a post without publishing.

### Protected (Requires ADMIN_API_KEY)

**Get Today's Posts**
```
GET /posts?key=ADMIN_API_KEY
```
Returns all pending posts from today.

**Get Statistics**
```
GET /stats?key=ADMIN_API_KEY
```
Returns post count by status (pending, posted, skipped).

**Skip All Posts**
```
GET /skip-all?key=ADMIN_API_KEY
```
Marks all today's pending posts as skipped.

### Utility

**Health Check**
```
GET /health
```
Server status and timestamp.

**Manual Job Trigger** (Dev only)
```
GET /dev/run-daily-job
```
Manually execute the entire daily pipeline.

## Daily Pipeline

The cron job executes this workflow once per day:

1. **FETCH** (📡): Aggregates news from multiple sources
   - Hacker News API (top 30 stories)
   - Dev.to API (trending articles)
   - Product Hunt API (trending products)
   - RSS feeds (configurable)

2. **NORMALIZE** (🔄): Converts data to consistent format
   - Extracts: title, URL, source, publish date, engagement metrics

3. **DEDUPLICATE** (🔄): Removes similar articles
   - Uses Levenshtein distance for string similarity
   - Default threshold: 85% match

4. **RANK** (📊): Scores by multiple factors
   - **Recency**: Recent articles score higher (100 → 0 over 48 hours)
   - **Engagement**: Comments/votes normalized to 0-100
   - **Keywords**: Boost for AI, security, startup, etc.
   - **Formula**: 0.25×recency + 0.35×engagement + 0.40×keywords

5. **GROUP** (📚): Groups similar articles
   - Creates logical topical groups
   - Selects best from each group

6. **GENERATE** (🤖): AI creates LinkedIn posts
   - Uses Groq API for fast generation
   - 2-3 news items per post
   - Output: Hook + 3-5 lines + personal take + hashtags

7. **STORE** (💾): Saves posts to MongoDB
   - Status: "pending"
   - Generates secure JWT tokens
   - Sets 24-hour expiry

8. **EMAIL** (📧): Sends daily digest
   - HTML email with 3-4 posts
   - "Post Now" and "Skip" buttons
   - Email links include secure tokens

## Database Schema

### Post Model

```javascript
{
  content: String,              // AI-generated post text
  sourceTitles: [String],       // Original news titles
  sourceUrls: [String],         // Original news URLs
  sources: [String],            // Source names
  score: Number,                // Combined ranking score
  status: String,               // "pending" | "posted" | "skipped"
  createdAt: Date,              // When post was generated
  postedAt: Date,               // When actually published
  skippedAt: Date,              // When skipped
  emailSentAt: Date,            // When included in email
  tokenExpiredAt: Date,         // Token expiry time
  hashtags: [String],           // Extracted hashtags
  metadata: Mixed               // Additional data
}
```

## Error Handling & Logging

All operations log to console with levels:
- **ERROR** (red): Critical failures
- **WARN** (yellow): Non-critical issues
- **INFO** (blue): Progress updates
- **DEBUG**: Detailed information

Configure log level: `LOG_LEVEL=info` in `.env`

## Security

- ✅ JWT tokens for email links (24-hour expiry)
- ✅ Admin API key protection for sensitive endpoints
- ✅ No sensitive data in logs
- ✅ MongoDB injection protection via Mongoose
- ✅ CORS configured
- ✅ Request body size limits

**Production Checklist**:
- [ ] Change `TOKEN_SECRET` and `ADMIN_API_KEY`
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas (don't expose localhost)
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Enable HTTPS/SSL
- [ ] Set strong email passwords
- [ ] Monitor Groq API usage and costs

## Development

### Running Tests
```bash
npm test                  # Run once
npm run test:watch      # Watch mode
```

### Code Quality
```bash
npm run lint            # Check style
npm run lint:fix        # Auto-fix issues
```

### Database Seeding (if implemented)
```bash
npm run seed
npm run migrate
```

## Troubleshooting

### "No news items collected"
- Check internet connection
- Verify API keys are valid
- Hacker News might be temporarily down

### "Failed to generate posts"
- Verify `GROQ_API_KEY` is correct
- Check Groq API status
- Monitor remaining quota on Groq console

### "Email not sending"
- Verify Gmail credentials and app password
- Enable "Less secure apps" if on older Gmail
- Check `EMAIL_SENDER` matches Gmail account

### "Posts not creating in MongoDB"
- Ensure MongoDB is running
- Check `MONGODB_URI` connection string
- View MongoDB logs for details

### "Cron job not running"
- Verify `CRON_SCHEDULE` format (cron syntax)
- Check server logs for initialization messages
- Use `/dev/run-daily-job` to manually trigger in dev mode

## Performance Optimization

- News fetching runs in parallel (Promise.allSettled)
- Similarity comparison uses optimized Levenshtein distance
- Database queries use indexes on status, date
- Email generation batches API calls

## Future Enhancements

- [ ] LinkedIn API integration for direct posting
- [ ] User authentication and preferences
- [ ] Custom keyword and source configuration
- [ ] Post scheduling and drafts
- [ ] Analytics dashboard
- [ ] Multiple user support
- [ ] Database connection pooling
- [ ] Redis caching for frequently accessed data
- [ ] Webhook notifications
- [ ] OpenAI/Claude AI provider options

## License

MIT

## Support

For issues: Check logs in `/src/utilities/logger.js`
For questions: Review architecture in `src/` directory structure

---

**Built with ❤️ using Node.js, Express, MongoDB, and Groq AI**
