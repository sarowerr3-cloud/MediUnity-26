import axios from "axios";

/**
 * Simulates online partner license verification against official government registries
 * (DGHS for Hospitals/Diagnostics, DGDA for Pharmacies)
 * 
 * @param {string} licenseNumber 
 * @param {string} partnerName 
 * @param {string} partnerType - "hospital" | "diagnostic" | "pharmacy"
 */
export async function verifyPartnerOnline(licenseNumber, partnerName, partnerType) {
  console.log(`[ONLINE AUDIT] Initiating registry verification for License: ${licenseNumber}, Entity: ${partnerName}, Type: ${partnerType}`);

  const cleanLicense = (licenseNumber || "").trim().toUpperCase();
  const cleanName = (partnerName || "").trim().toLowerCase();

  // Enforce realistic government license formatting
  if (partnerType === "hospital") {
    // Expected format: DGHS-HOSP-XXXXX
    if (!cleanLicense.startsWith("DGHS-HOSP-")) {
      return {
        success: false,
        reason: "Invalid license format. Hospital licenses must start with 'DGHS-HOSP-' (e.g. DGHS-HOSP-12345)"
      };
    }
  } else if (partnerType === "diagnostic") {
    // Expected format: DGHS-DIAG-XXXXX
    if (!cleanLicense.startsWith("DGHS-DIAG-")) {
      return {
        success: false,
        reason: "Invalid license format. Diagnostic licenses must start with 'DGHS-DIAG-' (e.g. DGHS-DIAG-12345)"
      };
    }
  } else if (partnerType === "pharmacy") {
    // Expected format: DGDA-PHAR-XXXXX
    if (!cleanLicense.startsWith("DGDA-PHAR-")) {
      return {
        success: false,
        reason: "Invalid license format. Pharmacy licenses must start with 'DGDA-PHAR-' (e.g. DGDA-PHAR-12345)"
      };
    }
  }

  // Simulate network scraper request to government portal
  try {
    const registryName = `${partnerType === "hospital" ? "DGHS (Health Services) License Board" : partnerType === "diagnostic" ? "DGHS Laboratory Registry" : "DGDA Drug Administration Portal"}`;
    console.log(`[ONLINE AUDIT] Connecting to ${registryName} at verify.gov.bd/license/${cleanLicense}...`);

    // Simulate short network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // For testing and simulation, we check if the license ends in a number.
    const digits = cleanLicense.split("-").pop();
    if (!digits || isNaN(digits)) {
      console.warn(`[ONLINE AUDIT] License registration code validation failed on ${registryName}.`);
      return {
        success: false,
        reason: "License number not found in government database."
      };
    }

    console.log(`[ONLINE AUDIT] Match found in ${registryName} for license: ${cleanLicense}`);
    return {
      success: true,
      registeredName: partnerName,
      status: "Active"
    };

  } catch (err) {
    console.error(`[ONLINE AUDIT ERROR] Government registry query crashed:`, err.message);
    throw new Error("Government verification portal timeout.");
  }
}
