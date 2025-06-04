// middleware/cache.middleware.js
const { redisHelper } = require("../config/redis.config");

/**
 * Middleware to cache GET responses in Redis.
 * @param {number} duration - expiration time in seconds
 */
const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    console.log(`[CACHE] Processing request: ${req.method} ${req.originalUrl}`);

    // Only cache GET requests
    if (req.method !== "GET") {
      console.log(`[CACHE] Skipping non-GET request: ${req.method}`);
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    console.log(`[CACHE] Using key: ${key}`);

    try {
      // 1. Check if a cached response exists
      console.log(`[CACHE] Checking for cached response: ${key}`);
      const cachedResponse = await redisHelper.get(key);

      if (cachedResponse) {
        const endTime = Date.now();
        console.log(
          `[CACHE HIT] Found cached response for key: ${key} (${
            endTime - startTime
          }ms)`
        );
        // If found in cache, return immediately
        return res.json({
          ...cachedResponse,
          _cached: true,
          _responseTime: endTime - startTime,
        });
      }

      console.log(`[CACHE MISS] No cached response found for key: ${key}`);

      // 2. Otherwise, override res.json to store the response in Redis
      const originalJson = res.json;
      res.json = function (body) {
        const responseTime = Date.now() - startTime;
        // Store the response in cache with expiration
        console.log(
          `[CACHE SET] Attempting to cache response for key: ${key}, duration: ${duration}`
        );

        redisHelper
          .setEx(key, duration, {
            ...body,
            _cached: false,
            _responseTime: responseTime,
          })
          .then(() => {
            console.log(
              `[CACHE SUCCESS] Successfully cached response for key: ${key}`
            );
          })
          .catch((err) => {
            console.error(
              `[CACHE ERROR] Failed to cache response for key: ${key}`,
              err
            );
          });

        // Send the response as usual
        return originalJson.call(this, {
          ...body,
          _cached: false,
          _responseTime: responseTime,
        });
      };

      next();
    } catch (error) {
      console.error(
        `[CACHE MIDDLEWARE ERROR] Error processing request: ${req.originalUrl}`,
        error
      );
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
    console.log(
      `[CACHE CLEAR] Attempting to clear cache with pattern: ${pattern}`
    );
    const keys = await redisHelper.keys(`cache:${pattern}`);
    console.log(`[CACHE CLEAR] Found ${keys.length} keys to clear`);

    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisHelper.del(key)));
      console.log(`[CACHE CLEAR] Successfully cleared ${keys.length} keys`);
    }
  } catch (error) {
    console.error("[CACHE CLEAR ERROR]", error);
  }
};

/**
 * Clear specific cache entry
 * @param {string} url - URL to clear from cache
 */
const clearCacheForUrl = async (url) => {
  try {
    const key = `cache:${url}`;
    console.log(`[CACHE CLEAR] Clearing specific cache key: ${key}`);
    await redisHelper.del(key);
    console.log(`[CACHE CLEAR] Successfully cleared cache for: ${key}`);
  } catch (error) {
    console.error(
      `[CACHE CLEAR ERROR] Failed to clear cache for ${url}`,
      error
    );
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCacheForUrl,
};
