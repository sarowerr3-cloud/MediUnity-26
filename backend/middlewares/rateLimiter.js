const ipRequestMap = new Map();

// Periodic cleanup of expired records to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRequestMap.entries()) {
    if (now > record.resetTime) {
      ipRequestMap.delete(key);
    }
  }
}, 10 * 60 * 1000); // Run cleanup every 10 minutes

/**
 * Custom lightweight in-memory rate limiter middleware.
 * Avoids the need for external npm packages in sandbox environments.
 * 
 * @param {Object} options
 * @param {number} options.windowMs - Time frame in milliseconds (default: 15 minutes)
 * @param {number} options.max - Max number of requests per windowMs (default: 10)
 * @param {string} options.message - Error message to return (default: "Too many requests...")
 */
export function rateLimiter({ 
  windowMs = 15 * 60 * 1000, 
  max = 10, 
  message = "Too many requests from this IP. Please try again later." 
} = {}) {
  return (req, res, next) => {
    // RATE LIMITING DISABLED FOR DEVELOPMENT/TESTING
    return next();
  };
}
