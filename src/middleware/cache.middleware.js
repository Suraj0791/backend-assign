const { redisHelper } = require("../config/redis.config");

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisHelper.get(key);

      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store the original res.json method
      const originalJson = res.json;

      // Override res.json method
      res.json = function (body) {
        // Store the response in cache
        redisHelper
          .setEx(key, duration, body)
          .catch((err) => console.error("Cache Error:", err));

        // Call the original res.json method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error("Cache Middleware Error:", error);
      next();
    }
  };
};

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
  clearCache,
};
