/**
 * Cron Job Registry and Scheduler
 * Registers and manages all scheduled tasks
 */

const cron = require('node-cron');
const config = require('../config/env');
const logger = require('../utils/logger');
const { executeDailyJob } = require('./dailyJob');

let scheduledJobs = [];

/**
 * Initialize all cron jobs
 * Called during server startup
 */
const initializeCronJobs = () => {
  try {
    logger.info('⏰ Initializing cron jobs...');

    // Daily Pipeline Job
    // Default: runs at 8 AM every day
    // Can be customized via CRON_SCHEDULE env variable
    const dailyJobSchedule = config.CRON_SCHEDULE || '* * * * * *'; // Running every second for testing

    const dailyJob = cron.schedule(dailyJobSchedule, async () => {
      logger.info('⏲️ Cron: Daily job triggered');
      try {
        const result = await executeDailyJob();
        
        if (!result.success) {
          logger.error('Daily job failed', result.error);
        }
      } catch (error) {
        logger.error('Cron job execution error', error.message);
      }
    });

    scheduledJobs.push({
      name: 'dailyPipeline',
      schedule: dailyJobSchedule,
      task: dailyJob,
    });

    logger.info(`✅ Daily pipeline job scheduled for: ${dailyJobSchedule}`);

    // Development: Allow manual trigger via endpoint
    if (config.NODE_ENV === 'development') {
      logger.info('💡 Development mode: Use /dev/run-daily-job to trigger manually');
    }

    return true;
  } catch (error) {
    logger.error('Cron initialization failed', error.message);
    return false;
  }
};

/**
 * Stop all cron jobs
 * Called during server shutdown
 */
const stopAllCronJobs = () => {
  logger.info('Stopping all cron jobs...');

  scheduledJobs.forEach(job => {
    job.task.stop();
    logger.info(`✅ Stopped: ${job.name}`);
  });

  scheduledJobs = [];
};

/**
 * Get list of scheduled jobs
 * @returns {Array} Array of job objects
 */
const getScheduledJobs = () => {
  return scheduledJobs.map(job => ({
    name: job.name,
    schedule: job.schedule,
  }));
};

module.exports = {
  initializeCronJobs,
  stopAllCronJobs,
  getScheduledJobs,
  executeDailyJob, // Export for manual testing
};
