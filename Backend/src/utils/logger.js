/**
 * Logger Utility
 * Simple logging utility with levels
 */

const config = require('../config/env');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

const currentLevel = levels[config.LOG_LEVEL] || levels.info;

const log = (level, message, data = '') => {
  if (levels[level] > currentLevel) return;

  const timestamp = new Date().toISOString();
  const color = levels[level] === 0 ? colors.red : levels[level] === 1 ? colors.yellow : colors.blue;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';

  console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}${dataStr}`);
};

module.exports = {
  error: (msg, data) => log('error', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  info: (msg, data) => log('info', msg, data),
  debug: (msg, data) => log('debug', msg, data),
};
