/**
 * Document Verifier — NID & Birth Certificate Validator
 *
 * Currently implements smart format validation for Bangladesh documents.
 * To plug in a real government API (BDRIS / Election Commission), 
 * set in backend/.env:
 *   BDRIS_API_KEY=your_key
 *   BDRIS_API_URL=https://api.bdris.gov.bd/verify  (example)
 *
 * Without the key, format-based validation is used (works in development).
 */

/**
 * Validate Bangladesh NID number format.
 * Valid lengths: 10, 13, or 17 digits (all numeric).
 */
function validateNidFormat(nid) {
  const clean = nid.replace(/\s/g, "");
  if (!/^\d+$/.test(clean)) return { valid: false, reason: "NID must contain only digits" };
  if (![10, 13, 17].includes(clean.length)) {
    return { valid: false, reason: `NID must be 10, 13, or 17 digits. Got ${clean.length}.` };
  }
  return { valid: true };
}

/**
 * Validate Bangladesh Birth Certificate (BDRIS) number format.
 * Valid format: exactly 17 digits.
 */
function validateBirthCertFormat(certNumber) {
  const clean = certNumber.replace(/\s/g, "");
  if (!/^\d+$/.test(clean)) return { valid: false, reason: "Birth certificate number must contain only digits" };
  if (clean.length !== 17) {
    return { valid: false, reason: `Birth certificate number must be exactly 17 digits. Got ${clean.length}.` };
  }
  return { valid: true };
}

/**
 * Verify NID via government API or format validation fallback.
 * @param {string} nid - The NID number
 * @param {string} name - Patient name (used for API verification)
 * @param {string} dob - Date of birth in YYYY-MM-DD format (used for API verification)
 * @returns {{ verified: boolean, reason: string }}
 */
export async function verifyNid(nid, name = "", dob = "") {
  const formatCheck = validateNidFormat(nid);
  if (!formatCheck.valid) {
    return { verified: false, reason: formatCheck.reason };
  }

  const apiKey = process.env.BDRIS_API_KEY;
  const apiUrl = process.env.BDRIS_API_URL;

  if (apiKey && apiUrl) {
    // Real API integration point
    try {
      const axios = (await import("axios")).default;
      const res = await axios.post(apiUrl, { nid, name, dob }, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        timeout: 10000
      });
      if (res.data?.verified) {
        return { verified: true, reason: "NID verified via government database" };
      }
      return { verified: false, reason: res.data?.message || "NID not found in government database" };
    } catch (err) {
      console.error("BDRIS NID API error:", err.message);
      // Fallback to format validation if API is unreachable
      return { verified: true, reason: "NID format valid (API unreachable, using format fallback)" };
    }
  }

  // Simulation: format is valid → consider verified
  console.log(`[DOC VERIFIER] NID ${nid} — format valid, simulating approval (no API key set)`);
  return { verified: true, reason: "NID format validated successfully" };
}

/**
 * Verify Birth Certificate via government API or format validation fallback.
 * @param {string} certNumber - The birth certificate number
 * @param {string} name - Patient name
 * @param {string} dob - Date of birth in YYYY-MM-DD format
 * @returns {{ verified: boolean, reason: string }}
 */
export async function verifyBirthCertificate(certNumber, name = "", dob = "") {
  const formatCheck = validateBirthCertFormat(certNumber);
  if (!formatCheck.valid) {
    return { verified: false, reason: formatCheck.reason };
  }

  const apiKey = process.env.BDRIS_API_KEY;
  const apiUrl = process.env.BDRIS_API_URL;

  if (apiKey && apiUrl) {
    try {
      const axios = (await import("axios")).default;
      const res = await axios.post(apiUrl, { birthCertNumber: certNumber, name, dob }, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        timeout: 10000
      });
      if (res.data?.verified) {
        return { verified: true, reason: "Birth certificate verified via BDRIS database" };
      }
      return { verified: false, reason: res.data?.message || "Birth certificate not found in BDRIS database" };
    } catch (err) {
      console.error("BDRIS Birth Cert API error:", err.message);
      return { verified: true, reason: "Birth cert format valid (API unreachable, using format fallback)" };
    }
  }

  console.log(`[DOC VERIFIER] Birth Cert ${certNumber} — format valid, simulating approval (no API key set)`);
  return { verified: true, reason: "Birth certificate format validated successfully" };
}
