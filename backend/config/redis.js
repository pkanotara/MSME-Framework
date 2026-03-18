const logger = require('../utils/logger');

let redisClient = null;

const initRedis = async () => {
  // Redis is optional - skip if not available
  logger.warn('Redis not configured - BullMQ jobs disabled');
};

const getRedis = () => redisClient;

module.exports = { initRedis, getRedis };