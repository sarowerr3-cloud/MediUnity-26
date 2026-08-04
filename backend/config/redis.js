// config/redis.js
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let isRedisAvailable = false;
let redisConnection = null;

try {
  redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 2000,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 1) {
        console.warn("[REDIS] Redis is offline. Utilizing in-memory queue fallback.");
        isRedisAvailable = false;
        return null; // stop retrying to avoid crashing
      }
      return 1000;
    }
  });

  redisConnection.on("error", (err) => {
    isRedisAvailable = false;
  });

  redisConnection.on("connect", () => {
    console.log("[REDIS] Connected successfully.");
    isRedisAvailable = true;
  });

  // Trigger connection
  redisConnection.connect().catch(() => {
    isRedisAvailable = false;
  });
} catch (e) {
  console.warn("[REDIS] Initialization error, using in-memory queue fallback:", e.message);
  isRedisAvailable = false;
}

export { isRedisAvailable, redisConnection };
