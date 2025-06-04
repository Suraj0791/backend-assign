// config/redis.config.js
const { createClient } = require("redis");
const winston = require("winston");

let redisClient = null;
let isConnecting = false;
let connectionPromise = null;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const connectRedis = async () => {
  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    console.log("Redis connection already in progress, waiting...");
    return connectionPromise;
  }

  // If already connected, return the client
  if (redisClient?.isOpen) {
    console.log("Redis client already connected");
    return redisClient;
  }

  isConnecting = true;
  let retries = 0;

  connectionPromise = new Promise(async (resolve, reject) => {
    while (retries < MAX_RETRIES) {
      try {
        // Clean up any existing client
        if (redisClient && !redisClient.isOpen) {
          try {
            await redisClient.disconnect();
          } catch (e) {
            console.log("Error disconnecting old client:", e.message);
          }
          redisClient = null;
        }

        const redisConfig = {
          url: `redis://${process.env.REDIS_USERNAME || 'default'}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'localhost'}:${parseInt(process.env.REDIS_PORT) || 6379}/${process.env.REDIS_DB || 0}`,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.log("Redis max reconnection attempts reached");
                return new Error("Redis max reconnection attempts reached");
              }
              return Math.min(retries * 100, 3000);
            },
            connectTimeout: 10000,
            lazyConnect: true,
          },
        };

        console.log("Connecting to Redis with config:", {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          username: process.env.REDIS_USERNAME || 'default',
          database: process.env.REDIS_DB || 0,
        });

        // Create Redis client
        redisClient = createClient(redisConfig);

        // Attach event handlers BEFORE connecting
        redisClient.on("connect", () => {
          console.log("Redis connected successfully");
          winston.info("Redis connected");
        });

        redisClient.on("ready", () => {
          console.log("Redis client ready");
          winston.info("Redis ready");
          isConnecting = false;
        });

        redisClient.on("error", (err) => {
          console.error("Redis connection error:", err);
          winston.error("Redis connection error:", err);
          // Don't set isConnecting to false here, let the connection attempt handle it
        });

        redisClient.on("end", () => {
          console.log("Redis connection closed");
          winston.info("Redis connection closed");
          redisClient = null;
          isConnecting = false;
          connectionPromise = null;
        });

        redisClient.on("reconnecting", () => {
          console.log("Redis reconnecting...");
          winston.info("Redis reconnecting");
        });

        // Connect to Redis
        await redisClient.connect();

        // Test the connection
        await redisClient.set("test", "Redis Connected");
        const testResult = await redisClient.get("test");
        console.log("Redis Test Result:", testResult);
        winston.info("Redis Test:", testResult);

        // Graceful shutdown on SIGINT
        process.on("SIGINT", async () => {
          if (redisClient && redisClient.isOpen) {
            await redisClient.quit();
            console.log("Redis connection closed through app termination");
            winston.info("Redis connection closed through app termination");
          }
        });

        isConnecting = false;
        resolve(redisClient);
        return;

      } catch (error) {
        console.error(`Redis connection attempt ${retries + 1} failed:`, error);
        retries++;

        if (retries < MAX_RETRIES) {
          console.log(
            `Retrying Redis connection in ${RETRY_DELAY / 1000} seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        } else {
          console.error("Max Redis connection retries reached");
          isConnecting = false;
          connectionPromise = null;
          reject(error);
          return;
        }
      }
    }
  });

  return connectionPromise;
};

const getRedisClient = async () => {
  if (!redisClient?.isOpen) {
    console.log("Redis client not available, attempting to connect...");
    await connectRedis();
  }
  
  if (!redisClient?.isOpen) {
    throw new Error("Redis client not initialized or closed. Connection failed.");
  }
  
  return redisClient;
};

// Helper functions for Redis operations with better error handling
const redisHelper = {
  // Set key with expiration
  setEx: async (key, seconds, value) => {
    try {
      const client = await getRedisClient();
      return await client.setEx(key, seconds, JSON.stringify(value));
    } catch (error) {
      console.error("Redis SetEx Error:", error);
      throw error;
    }
  },

  // Get value by key
  get: async (key) => {
    try {
      const client = await getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis Get Error:", error);
      throw error;
    }
  },

  // Delete key
  del: async (key) => {
    try {
      const client = await getRedisClient();
      return await client.del(key);
    } catch (error) {
      console.error("Redis Delete Error:", error);
      throw error;
    }
  },

  // Get all keys matching pattern
  keys: async (pattern) => {
    try {
      const client = await getRedisClient();
      return await client.keys(pattern);
    } catch (error) {
      console.error("Redis Keys Error:", error);
      throw error;
    }
  },

  // Clear all cache
  clearAll: async () => {
    try {
      const client = await getRedisClient();
      await client.flushAll();
      console.log("Redis cache cleared");
    } catch (error) {
      console.error("Redis Clear All Error:", error);
      throw error;
    }
  },

  // Increment counter
  incr: async (key) => {
    try {
      const client = await getRedisClient();
      return await client.incr(key);
    } catch (error) {
      console.error("Redis Incr Error:", error);
      throw error;
    }
  },

  // Set expiration
  expire: async (key, seconds) => {
    try {
      const client = await getRedisClient();
      return await client.expire(key, seconds);
    } catch (error) {
      console.error("Redis Expire Error:", error);
      throw error;
    }
  },

  // Ping Redis
  ping: async () => {
    try {
      const client = await getRedisClient();
      return await client.ping();
    } catch (error) {
      console.error("Redis Ping Error:", error);
      throw error;
    }
  },

  // Check if Redis is connected
  isConnected: () => {
    return redisClient?.isOpen || false;
  },
};

module.exports = {
  connectRedis,
  getRedisClient,
  redisHelper,
};