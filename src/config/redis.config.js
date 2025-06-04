const { createClient } = require("redis");
const winston = require("winston");

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        winston.error("Redis connection lost. Max retries reached.");
        return new Error("Redis max retries reached");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Error handling
redisClient.on("error", (err) => {
  winston.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  winston.info("Redis Client Connected");
});

redisClient.on("reconnecting", () => {
  winston.info("Redis Client Reconnecting");
});

redisClient.on("ready", () => {
  winston.info("Redis Client Ready");
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    winston.error("Redis Connection Error:", error);
    process.exit(1);
  }
};

// Helper functions for Redis operations
const redisHelper = {
  // Set key with expiration
  setEx: async (key, seconds, value) => {
    try {
      return await redisClient.setEx(key, seconds, JSON.stringify(value));
    } catch (error) {
      winston.error("Redis SetEx Error:", error);
      throw error;
    }
  },

  // Get value by key
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      winston.error("Redis Get Error:", error);
      throw error;
    }
  },

  // Delete key
  del: async (key) => {
    try {
      return await redisClient.del(key);
    } catch (error) {
      winston.error("Redis Delete Error:", error);
      throw error;
    }
  },

  // Get all keys matching pattern
  keys: async (pattern) => {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      winston.error("Redis Keys Error:", error);
      throw error;
    }
  },

  // Clear all cache
  clearAll: async () => {
    try {
      await redisClient.flushAll();
      winston.info("Redis cache cleared");
    } catch (error) {
      winston.error("Redis Clear All Error:", error);
      throw error;
    }
  },
};

module.exports = {
  redisClient,
  connectRedis,
  redisHelper,
};
