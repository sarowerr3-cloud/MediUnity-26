import { redisConnection, isRedisAvailable } from "../config/redis.js";

// Cache Key Generators matching request details
export const keys = {
  doctorProfile: (id) => `doctor:profile:${id}`,
  doctorSlots: (doctorId, date) => `doctor:slots:${doctorId}:${date || "all"}`,
  patientAppointments: (patientId) => `patient:appointments:${patientId}`,
  articleFeed: (category, page) => `article:feed:${category || "all"}:${page || 1}`,
  topDoctors: () => "doctors:top",
  symptomResult: (hash) => `symptom:result:${hash}`,
};

// In-memory fallback cache when Redis is offline
const memoryCache = new Map();

// Periodic cleanup of expired cache entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiry && now > item.expiry) {
      memoryCache.delete(key);
    }
  }
}, 60000).unref();

/**
 * Get deserialized JSON data from Redis cache or local in-memory cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null
 */
export async function get(key) {
  if (!isRedisAvailable || !redisConnection) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    // Return a deep clone to prevent mutation of the cached object reference
    return JSON.parse(JSON.stringify(item.value));
  }
  try {
    const value = await redisConnection.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (err) {
    console.error(`[CACHE GET ERROR] key: ${key}`, err.message);
    return null;
  }
}

/**
 * Save serialized data to Redis cache or local in-memory cache
 * @param {string} key - Cache key
 * @param {any} value - Object or value to cache
 * @param {number} ttlSeconds - Expiration time in seconds
 */
export async function set(key, value, ttlSeconds) {
  if (!isRedisAvailable || !redisConnection) {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    // Store a deep clone to prevent reference sharing mutations
    memoryCache.set(key, {
      value: JSON.parse(JSON.stringify(value)),
      expiry
    });
    return true;
  }
  try {
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await redisConnection.set(key, data, "EX", ttlSeconds);
    } else {
      await redisConnection.set(key, data);
    }
    return true;
  } catch (err) {
    console.error(`[CACHE SET ERROR] key: ${key}`, err.message);
    return false;
  }
}

/**
 * Delete key from cache
 * @param {string} key - Cache key
 */
export async function del(key) {
  if (!isRedisAvailable || !redisConnection) {
    return memoryCache.delete(key);
  }
  try {
    await redisConnection.del(key);
    return true;
  } catch (err) {
    console.error(`[CACHE DEL ERROR] key: ${key}`, err.message);
    return false;
  }
}

/**
 * Delete keys matching a wildcard pattern (e.g. "doctor:slots:123:*")
 * @param {string} pattern - Key match pattern
 */
export async function delPattern(pattern) {
  if (!isRedisAvailable || !redisConnection) {
    const regexStr = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexStr}$`);
    let deletedCount = 0;
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        deletedCount++;
      }
    }
    return true;
  }
  try {
    const keysFound = await redisConnection.keys(pattern);
    if (keysFound && keysFound.length > 0) {
      await redisConnection.del(keysFound);
    }
    return true;
  } catch (err) {
    console.error(`[CACHE DELPATTERN ERROR] pattern: ${pattern}`, err.message);
    return false;
  }
}
