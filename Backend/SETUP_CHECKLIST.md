# LinkForge Backend - Setup Checklist ✅

## Pre-Installation Checklist

- [ ] Node.js 14+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB running locally OR MongoDB Atlas account
- [ ] Groq API account (free at console.groq.com)
- [ ] Gmail account with 2-factor authentication
- [ ] Git installed (optional, for version control)

---

## Installation Steps

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```
**Expected**: No errors, installs ~40 packages

- [ ] Dependencies installed
- [ ] node_modules/ folder created
- [ ] package-lock.json generated

### Step 2: Create Environment File
```bash
cp .env.example .env
```

- [ ] .env file created in Backend/ folder

### Step 3: Configure Environment Variables

Edit `.env` and fill in:

#### 3a. Groq API Key (Required)
1. Go to https://console.groq.com/keys
2. Click "Create API Key"
3. Copy the key
4. Paste in `.env`: `GROQ_API_KEY=gsk_...`

- [ ] GROQ_API_KEY set

#### 3b. Gmail Setup (Required for email)
1. Go to Gmail account
2. Enable 2-factor authentication (if not already)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. Copy generated password
6. Set in `.env`:
   ```
   EMAIL_SENDER=your.email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   EMAIL_RECIPIENT=your.email@gmail.com
   ```

- [ ] EMAIL_SENDER set
- [ ] EMAIL_PASSWORD set
- [ ] EMAIL_RECIPIENT set

#### 3c. MongoDB Connection (Required)
Option A - Local:
```
MONGODB_URI=mongodb://localhost:27017/linkforge
```

Option B - MongoDB Atlas (cloud):
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Paste in `.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/linkforge
```

- [ ] MONGODB_URI set

#### 3d. Security Keys (Recommended - Change from defaults)
```
TOKEN_SECRET=my-super-secret-key-change-this
ADMIN_API_KEY=my-admin-key-change-this
```

- [ ] TOKEN_SECRET set
- [ ] ADMIN_API_KEY set

#### 3e. Optional Configurations
```
# Cron schedule (default: 8 AM daily)
CRON_SCHEDULE=0 8 * * *

# Log level (info, debug, error)
LOG_LEVEL=info

# Node environment
NODE_ENV=development
```

- [ ] .env file completely filled out and saved

### Step 4: Start MongoDB

**Option A - Local MongoDB:**
```bash
# Mac/Linux
mongod

# Windows (if installed)
mongod.exe
```

**Option B - MongoDB Atlas:**
- Already running in cloud, no local action needed

**Option C - Docker Compose:**
```bash
docker-compose up mongodb
```

- [ ] MongoDB accessible on mongodb://localhost:27017 or via Atlas

### Step 5: Start the Server

```bash
npm run dev
```

**Expected output:**
```
✅ MongoDB connected: localhost
⏰ Initializing cron jobs...
✅ Daily pipeline job scheduled for: 0 8 * * *
✅ Server started on port 5000
📍 Base URL: http://localhost:5000
```

- [ ] Server started without errors
- [ ] Listening on port 5000

### Step 6: Verify Installation

In another terminal:
```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

- [ ] Health check returns success

---

## Testing Checklist

### Test 1: Service Tests
```bash
node scripts/testServices.js
```

**Expected**: 6 tests pass
- [ ] String similarity test
- [ ] Token generation test
- [ ] Groq connection test
- [ ] Post generation test
- [ ] Ranking test
- [ ] Deduplication test

### Test 2: Manual Daily Job Trigger
```bash
curl http://localhost:5000/dev/run-daily-job
```

**Expected**:
- Fetches ~45 articles
- Normalizes to consistent format
- Deduplicates to ~38 unique
- Ranks top 12
- Generates 4 posts
- Stores in MongoDB
- Sends email
- Total time: 20-30 seconds
- Response: JSON with pipeline steps

- [ ] Daily job completes successfully
- [ ] Email received in inbox

### Test 3: Email Link Validation
1. Check email inbox
2. Look for "LinkForge Daily Digest" email
3. Click "Post Now" button on one post
4. Should see: "Post published successfully!"

- [ ] Email received
- [ ] Email links work
- [ ] Post status updated in database

### Test 4: Admin Endpoints
```bash
curl "http://localhost:5000/posts?key=YOUR_ADMIN_API_KEY"
```

Replace `YOUR_ADMIN_API_KEY` with the value you set in .env

**Expected**:
- [ ] Returns today's posts
- [ ] Shows correct count
- [ ] Each post has content, status, score

Get statistics:
```bash
curl "http://localhost:5000/stats?key=YOUR_ADMIN_API_KEY"
```

**Expected**: Shows { pending: X, posted: Y, skipped: Z, total: N }

- [ ] Stats endpoint works
- [ ] Correct numbers

---

## Troubleshooting Checklist

### Issue: "GROQ_API_KEY not configured"
- [ ] GROQ_API_KEY is in .env file
- [ ] Value starts with `gsk_`
- [ ] No extra spaces in key
- [ ] Restarted server after adding key

### Issue: "Gmail login failed"
- [ ] EMAIL_SENDER is correct Gmail address
- [ ] Using app password, NOT regular password
- [ ] 2-factor authentication enabled on Gmail
- [ ] App password copied correctly (has spaces)

### Issue: "MongoDB connection failed"
- [ ] MongoDB is running (mongod)
- [ ] MONGODB_URI is correct
- [ ] For local: `mongodb://localhost:27017/linkforge`
- [ ] For Atlas: connection string has password

### Issue: "No posts created"
- [ ] All API keys are valid
- [ ] No errors in console
- [ ] Check `/dev/run-daily-job` response for errors

### Issue: "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```
Then either:
- Kill the process using that port
- Change PORT in .env to 5001, 5002, etc.

- [ ] Issue resolved

---

## Production Deployment Checklist

**Before deploying to production:**

### Security
- [ ] Changed TOKEN_SECRET to random 32-char string
- [ ] Changed ADMIN_API_KEY to random 32-char string
- [ ] Set NODE_ENV=production
- [ ] Set CORS_ORIGIN to your frontend domain
- [ ] No sensitive data in code or logs

### Database
- [ ] Using MongoDB Atlas (not localhost)
- [ ] Backup configured
- [ ] Connection string has strong password

### Monitoring
- [ ] Error tracking setup (optional: Sentry)
- [ ] Logging configured
- [ ] Uptime monitoring setup (optional)

### Email
- [ ] SMTP credentials tested
- [ ] Email reputation checked
- [ ] Bounce handling configured

### Deployment
- [ ] Docker image built and tested
- [ ] docker-compose.yml configured
- [ ] Environment secrets properly managed
- [ ] Health checks configured
- [ ] Auto-restart enabled

- [ ] Ready for production

---

## Daily Operations Checklist

**After deployment, monitor:**

### Daily
- [ ] Check email received at expected time
- [ ] Verify posts created in database
- [ ] Check for any error logs
- [ ] Review any failed API calls

### Weekly
- [ ] Review post stats (/stats endpoint)
- [ ] Check click-through rate on emails
- [ ] Monitor database size
- [ ] Review Groq API usage

### Monthly
- [ ] Archive old posts (older than 30 days)
- [ ] Review API performance
- [ ] Update dependencies: `npm outdated`
- [ ] Backup database

- [ ] Monitoring routine established

---

## What's Working

When everything is configured correctly, you should have:

- [ ] Daily 8 AM cron job runs automatically
- [ ] 4 LinkedIn posts generated per day
- [ ] Email digest sent to your inbox
- [ ] "Post Now" links work correctly
- [ ] Posts saved to MongoDB
- [ ] Admin API endpoints protected
- [ ] Error handling and logging working
- [ ] Development endpoints available

---

## Next Steps

1. **Customize**
   - [ ] Adjust CRON_SCHEDULE for different time
   - [ ] Edit email template in src/services/email/sendDigest.js
   - [ ] Add custom keywords in src/config/constants.js

2. **Extend**
   - [ ] Add LinkedIn API integration (future)
   - [ ] Add user authentication (future)
   - [ ] Create admin dashboard (future)

3. **Document**
   - [ ] Document any custom changes
   - [ ] Update README.md with specifics
   - [ ] Version control with Git

4. **Monitor**
   - [ ] Setup error notifications
   - [ ] Monitor server health
   - [ ] Track costs (Groq API)

---

## Support Resources

- **Quick Start**: Read QUICKSTART.md
- **Full Docs**: Read README.md  
- **Architecture**: Read ARCHITECTURE.md
- **API Guide**: See API_EXAMPLES.js
- **Docker**: Read DOCKER.md
- **Code**: Check src/ files (all have detailed comments)

---

## Success Criteria

You'll know everything is working when:

✅ npm run dev starts without errors
✅ curl http://localhost:5000/health returns success
✅ /dev/run-daily-job completes in 20-30 seconds
✅ Email received in inbox
✅ Email links work correctly
✅ /stats shows post counts
✅ Daily cron job runs at 8 AM
✅ Posts appear in MongoDB

---

**Version**: 1.0.0
**Status**: Production Ready ✅
**Last Updated**: January 2024

Good luck! 🚀
