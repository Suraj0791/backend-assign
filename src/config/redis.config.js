// config/redis.config.js
const redis = require("redis");
const winston = require("winston");
const { promisify } = require("util");

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      username: process.env.REDIS_USERNAME || "default",
      db: process.env.REDIS_DB || 0
    };

    // legacyMode:true allows us to use callback-based commands + promisify
    const options = {
      host: redisConfig.host,
      port: redisConfig.port,
      username: redisConfig.username,
      password: redisConfig.password,
      legacyMode: true
    };

    redisClient = redis.createClient(options);

    // Attach event handlers
    redisClient.on("connect", () => {
      winston.info("Redis connected");
    });

    redisClient.on("ready", () => {
      winston.info("Redis ready");
    });

    redisClient.on("error", (err) => {
      winston.error("Redis connection error:", err);
    });

    redisClient.on("end", () => {
      winston.info("Redis connection closed");
    });

    // Connect (in legacy mode)
    await redisClient.connect();

    // Test the connection once
    const setAsync = promisify(redisClient.set).bind(redisClient);
    const getAsync = promisify(redisClient.get).bind(redisClient);

    await setAsync("test", "Redis Cloud Connected");
    const testResult = await getAsync("test");
    winston.info("Redis Cloud Test:", testResult);

    // Graceful shutdown on SIGINT
    process.on("SIGINT", async () => {
      if (redisClient) {
        await redisClient.quit();
        winston.info("Redis connection closed through app termination");
      }
    });
  } catch (error) {
    winston.error("Redis setup failed:", error);
    process.exit(1);
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
};

// Helper functions for Redis operations
const redisHelper = {
  // Set key with expiration
  setEx: async (key, seconds, value) => {
    try {
      const setExAsync = promisify(redisClient.setex).bind(redisClient);
      return await setExAsync(key, seconds, JSON.stringify(value));
    } catch (error) {
      winston.error("Redis SetEx Error:", error);
      throw error;
    }
  },

  // Get value by key
  get: async (key) => {
    try {
      const getAsync = promisify(redisClient.get).bind(redisClient);
      const value = await getAsync(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      winston.error("Redis Get Error:", error);
      throw error;
    }
  },

  // Delete key
  del: async (key) => {
    try {
      const delAsync = promisify(redisClient.del).bind(redisClient);
      return await delAsync(key);
    } catch (error) {
      winston.error("Redis Delete Error:", error);
      throw error;
    }
  },

  // Get all keys matching pattern
  keys: async (pattern) => {
    try {
      const keysAsync = promisify(redisClient.keys).bind(redisClient);
      return await keysAsync(pattern);
    } catch (error) {
      winston.error("Redis Keys Error:", error);
      throw error;
    }
  },

  // Clear all cache
  clearAll: async () => {
    try {
      await redisClient.flushall();
      winston.info("Redis cache cleared");
    } catch (error) {
      winston.error("Redis Clear All Error:", error);
      throw error;
    }
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  redisHelper
};
