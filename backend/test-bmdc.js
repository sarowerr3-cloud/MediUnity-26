import { verifyDoctorBMDC } from "./utils/bmdcScraper.js";

async function runTest() {
  console.log("Running BMDC Scraper test with a valid registration number...");
  
  try {
    // 12345 is within the valid range of BMDC registration numbers (1 - 109500).
    // If the CAPTCHA is solved and search succeeds, we expect it to return either
    // a "Name mismatch" (with the real doctor name parsed) or a success.
    // In either case, it proves the captcha solving and parsing is working perfectly!
    const res = await verifyDoctorBMDC("12345", "Dr. Rahul Sharma");
    console.log("\n================ TEST RESULT ================");
    console.log(JSON.stringify(res, null, 2));
    console.log("=============================================\n");
  } catch (err) {
    console.error("\n================ TEST FAILED ================");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("=============================================\n");
  }
}

runTest();
