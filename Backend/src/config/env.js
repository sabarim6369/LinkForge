/**
 * Environment Configuration
 * Loads and validates all environment variables
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'GROQ_API_KEY',
  'EMAIL_SENDER',
  'EMAIL_PASSWORD',
  'PORT',
];

// Check for required variables
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
}

const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/linkforge',

  // AI/LLM Configuration
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',

  // Email Configuration
  EMAIL_SENDER: process.env.EMAIL_SENDER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_RECIPIENT: process.env.EMAIL_RECIPIENT || 'user@example.com',
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',

  // Security
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'your-secret-key-change-in-production',
  TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || '24h',

  // News Sources
  HACKER_NEWS_API: 'https://hacker-news.firebaseio.com/v0',
  NEWS_API_KEY: process.env.NEWS_API_KEY,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Cron Schedule (default: 8 AM daily)
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || '0 8 * * *',
};

module.exports = config;
