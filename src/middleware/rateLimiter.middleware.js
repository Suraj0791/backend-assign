// middleware/rateLimiter.middleware.js
const { redisHelper } = require("../config/redis.config");

const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const MAX_REQUESTS = 30; // 30 requests per minute

// In-memory fallback for when Redis is not available
const memoryStore = new Map();

// Clean up expired entries from memory store
const cleanupMemoryStore = () => {
  const now = Date.now();
  for (const [key, data] of memoryStore.entries()) {
    if (now > data.expiry) {
      memoryStore.delete(key);
    }
  }
};

// Clean up every 5 minutes
setInterval(cleanupMemoryStore, 5 * 60 * 1000);

/**
 * Redis-based rate limiter middleware with memory fallback
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 */
const redisRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 30, // 30 requests default
    message = "Too many requests, please try again later.",
    keyGenerator = (req) => req.ip, // Default key generator
  } = options;

  return async (req, res, next) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const windowSeconds = Math.floor(windowMs / 1000);
      
      console.log(`[RATE LIMIT] Checking rate limit for key: ${key}`);

      let currentCount = 0;
      let usingRedis = false;

      // Try Redis first
      try {
        if (redisHelper.isConnected()) {
          // Use Redis INCR for atomic increment
          const count = await redisHelper.incr(key);
          
          // Set expiration on first increment
          if (count === 1) {
            await redisHelper.expire(key, windowSeconds);
          }
          
          currentCount = count;
          usingRedis = true;
          console.log(`[RATE LIMIT] Using Redis for key: ${key}, count: ${currentCount}`);
        } else {
          throw new Error("Redis not connected");
        }
      } catch (error) {
        console.warn("[RATE LIMIT] Redis unavailable, falling back to memory store:", error.message);
        
        // Fallback to memory store
        const now = Date.now();
        const memoryKey = key;
        const stored = memoryStore.get(memoryKey);
        
        if (stored && now < stored.expiry) {
          currentCount = stored.count + 1;
          memoryStore.set(memoryKey, { count: currentCount, expiry: stored.expiry });
        } else {
          currentCount = 1;
          const expiry = Date.now() + windowMs;
          memoryStore.set(memoryKey, { count: currentCount, expiry });
        }
        
        console.log(`[RATE LIMIT] Using memory store for key: ${key}, count: ${currentCount}`);
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - currentCount));
      res.setHeader(
        "X-RateLimit-Reset",
        Math.floor(Date.now() / 1000) + windowSeconds
      );

      if (currentCount > max) {
        console.log(
          `[RATE LIMIT] Rate limit exceeded for ${keyGenerator(req)} (${currentCount}/${max}) using ${usingRedis ? 'Redis' : 'Memory'}`
        );
        return res.status(429).json({
          error: "Too many requests",
          message: message,
          retryAfter: windowSeconds,
        });
      }

      console.log(
        `[RATE LIMIT] Request allowed for ${keyGenerator(req)} (${currentCount}/${max}) using ${usingRedis ? 'Redis' : 'Memory'}`
      );
      next();
    } catch (error) {
      console.error("[RATE LIMIT] Critical error in rate limiter:", error);
      // If everything fails, allow the request to proceed but log the error
      console.warn("[RATE LIMIT] Critical error, allowing request to proceed");
      next();
    }
  };
};

module.exports = redisRateLimiter;