import crypto from "crypto";

/**
 * Generates a unique, human-readable serial number / tracking number.
 * Format: PREFIX-YYMMDD-XXXXXXXX
 * E.g., APT-260715-E7A1F9C2
 * 
 * @param {string} prefix - The prefix code (e.g., 'APT', 'HTB', 'DTB', 'SVC')
 * @returns {string} The generated serial number.
 */
export function generateSerialNumber(prefix = "MC") {
  const today = new Date();
  
  // Format Date: YYMMDD
  const yy = String(today.getFullYear()).slice(-2);
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`;
  
  // Generate 8-character unique hex random bytes (4 bytes total)
  const randomStr = crypto.randomBytes(4).toString("hex").toUpperCase();
  
  return `${prefix}-${dateStr}-${randomStr}`;
}
