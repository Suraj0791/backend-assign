// middleware/cache.middleware.js
const { redisHelper } = require("../config/redis.config");

/**
 * Middleware to cache GET responses in Redis.
 * @param {number} duration - expiration time in seconds
 */
const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      // 1. Check if a cached response exists
      const cachedResponse = await redisHelper.get(key);
      if (cachedResponse) {
        // If found in cache, return immediately
        return res.json(cachedResponse);
      }

      // 2. Otherwise, override res.json to store the response in Redis
      const originalJson = res.json;
      res.json = function (body) {
        // Store the response in cache with expiration
        redisHelper
          .setEx(key, duration, body)
          .catch((err) => console.error("Cache Error:", err));

        // Send the response as usual
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error("Cache Middleware Error:", error);
      next();
    }
  };
};

/**
 * Utility to clear all cached keys matching pattern
 * @param {string} pattern
 */
const clearCache = async (pattern) => {
  try {
    const keys = await redisHelper.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisHelper.del(key)));
    }
  } catch (error) {
    console.error("Clear Cache Error:", error);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache
};
