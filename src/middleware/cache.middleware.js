const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect().catch(console.error);

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Store the original res.json method
      const originalJson = res.json;

      // Override res.json method
      res.json = function (body) {
        // Store the response in cache
        redisClient
          .setEx(key, duration, JSON.stringify(body))
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
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Clear Cache Error:", error);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
};
