import AuditLog from "../models/AuditLog.js";

// Helper function to recursively redact sensitive fields
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  try {
    const copy = JSON.parse(JSON.stringify(obj));
    const sensitiveKeys = ["password", "token", "creditCard", "nid", "cvv", "accessToken", "secret", "birthCertNumber"];
    
    const recursiveSanitize = (target) => {
      for (const key in target) {
        if (sensitiveKeys.includes(key)) {
          target[key] = "[REDACTED]";
        } else if (typeof target[key] === "object" && target[key] !== null) {
          recursiveSanitize(target[key]);
        }
      }
    };

    recursiveSanitize(copy);
    return copy;
  } catch (err) {
    return { error: "Failed to sanitize payload metadata" };
  }
}

/**
 * Express middleware factory to log sensitive client operations
 * @param {string} action - Action enum name
 * @param {string} resourceType - Type of resource
 * @param {function} getResourceId - Custom extractor callback for resource ID
 */
export function auditLog(action, resourceType, getResourceId = null) {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function (body) {
      // Restore send to prevent recursion
      res.send = originalSend;
      res.send(body);

      // Perform logging asynchronously after dispatching the response
      try {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        let failureReason = null;
        let responseJson = null;

        try {
          responseJson = typeof body === "string" ? JSON.parse(body) : body;
        } catch (e) {
          // Response body was not JSON or already parsed
          responseJson = body;
        }

        if (!isSuccess) {
          failureReason = responseJson?.message || `HTTP Error ${res.statusCode}`;
        }

        const user = req.user || req.auth || {};
        const userId = user.uid || user.userId || null;
        const userRole = user.role || (req.admin ? req.admin.role : "anonymous");
        
        let resourceId = null;
        if (getResourceId) {
          try {
            resourceId = getResourceId(req, responseJson);
          } catch (e) {
            resourceId = null;
          }
        } else {
          resourceId = req.params.id || req.body.id || responseJson?.id || responseJson?._id || null;
        }

        // Sanitize request data
        const metadata = {
          query: sanitizeObject(req.query),
          body: sanitizeObject(req.body),
        };

        AuditLog.create({
          userId,
          userRole,
          action,
          resourceType,
          resourceId: resourceId ? String(resourceId) : null,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "unknown",
          success: isSuccess,
          failureReason,
          metadata,
        }).catch((err) => {
          console.error("[AUDIT LOG SAVING ERROR]", err.message);
        });
      } catch (err) {
        console.error("[AUDIT LOG INTERCEPTOR ERROR]", err.message);
      }
    };

    next();
  };
}
export default auditLog;
