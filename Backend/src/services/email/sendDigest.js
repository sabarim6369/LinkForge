/**
 * Email Service
 * Sends HTML email digests with generated posts
 */

const nodemailer = require('nodemailer');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const { generateToken } = require('../../utils/tokenManager');

/**
 * Create email transporter
 * Configures nodemailer with Gmail or other email service
 * @returns {object} Nodemailer transporter
 */
const createTransporter = () => {
  try {
    const transporter = nodemailer.createTransport({
      service: config.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: config.EMAIL_SENDER,
        pass: config.EMAIL_PASSWORD,
      },
    });

    logger.info(`✅ Email transporter configured for ${config.EMAIL_SERVICE}`);
    return transporter;
  } catch (error) {
    logger.error('Email transporter creation failed', error.message);
    return null;
  }
};

/**
 * Generate HTML email template
 * Creates a professional LinkedIn-style email digest
 * @param {Array} posts - Array of post objects with content, tokens, etc
 * @param {Date} sendDate - Date the email is being sent
 * @returns {string} HTML email content
 */
const generateEmailHTML = (posts, sendDate = new Date()) => {
  const dateStr = sendDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const postsHTML = posts
    .map(
      (post, idx) => `
      <div style="background: #f8f9fa; padding: 20px; margin: 15px 0; border-left: 4px solid #0066cc; border-radius: 4px;">
        <div style="color: #666; font-size: 12px; margin-bottom: 10px;">POST ${idx + 1} OF ${posts.length}</div>
        
        <div style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin-bottom: 15px; white-space: pre-wrap;">
${post.content}
        </div>
        
        <div style="margin-top: 15px;">
          <a href="${process.env.APP_URL || 'http://localhost:5000'}/post?id=${post._id}&token=${post.token}" 
             style="display: inline-block; background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
            📤 Post Now
          </a>
          <a href="${process.env.APP_URL || 'http://localhost:5000'}/skip?id=${post._id}&token=${post.token}" 
             style="display: inline-block; background: #e0e0e0; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            ⏭️ Skip
          </a>
        </div>
        
        <div style="color: #999; font-size: 11px; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
          Sources: ${post.sources.join(', ')} • Score: ${post.score}
        </div>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .footer { color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 LinkForge Daily Digest</h1>
            <p>${dateStr}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Here are today's top trending tech stories, curated and summarized with AI insights. Click "Post Now" to publish directly to your LinkedIn profile.
          </p>
          
          ${postsHTML}
          
          <div class="footer">
            <p>LinkForge © 2024 | Your AI-Powered Personal Branding Assistant</p>
            <p style="font-size: 11px;">This email was generated automatically. Links expire in 24 hours.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Send email digest
 * Sends posts to the configured email recipient
 * @param {Array} posts - Array of post objects with content and tokens
 * @param {string} recipientEmail - Email address to send to (default from config)
 * @returns {Promise<boolean>} True if email sent successfully
 */
const sendEmailDigest = async (posts, recipientEmail = config.EMAIL_RECIPIENT) => {
  try {
    if (!posts || posts.length === 0) {
      logger.warn('No posts to send in email digest');
      return false;
    }

    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    const mailOptions = {
      from: config.EMAIL_SENDER,
      to: recipientEmail,
      subject: `${config.EMAIL.SUBJECT_PREFIX} - ${new Date().toLocaleDateString()}`,
      html: generateEmailHTML(posts),
      text: `LinkForge Daily Digest\n\nYou have ${posts.length} new posts. Please open this email in an HTML-capable email client.`,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`✅ Email sent successfully. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Email sending failed', error.message);
    return false;
  }
};

/**
 * Test email configuration
 * Sends a test email to verify setup
 * @returns {Promise<boolean>} True if test email sent
 */
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create transporter');
    }

    await transporter.verify();
    logger.info('✅ Email configuration verified');
    return true;
  } catch (error) {
    logger.error('Email configuration test failed', error.message);
    return false;
  }
};

module.exports = {
  createTransporter,
  generateEmailHTML,
  sendEmailDigest,
  testEmailConfig,
};
