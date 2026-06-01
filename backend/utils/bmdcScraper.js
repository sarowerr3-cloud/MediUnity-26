import axios from "axios";
import * as cheerio from "cheerio";
import { createWorker } from "tesseract.js";
import { Jimp } from "jimp";

const BMDC_URL = "https://verify.bmdc.org.bd/";
const BMDC_POST_URL = "https://verify.bmdc.org.bd/regfind";

/**
 * Clean up text helper
 */
function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

/**
 * Preprocess captcha image buffer to make it easier for OCR
 */
async function preprocessCaptcha(buffer) {
  try {
    const image = await Jimp.read(buffer);
    // Resize by 3x (original is 100x30, so make it 300x90)
    image.resize({ w: 300, h: 90 });
    // Convert to greyscale
    image.greyscale();
    // Increase contrast
    image.contrast(0.8);
    
    // Thresholding to make it clean black and white
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx];
      // If the pixel value is dark (e.g. less than 130), make it black (0), otherwise white (255)
      const val = red < 130 ? 0 : 255;
      this.bitmap.data[idx] = val;
      this.bitmap.data[idx + 1] = val;
      this.bitmap.data[idx + 2] = val;
    });

    return await image.getBuffer("image/png");
  } catch (e) {
    console.error("Error preprocessing captcha:", e.message);
    return buffer; // Return original if error
  }
}

/**
 * Solve captcha using tesseract.js
 */
async function solveCaptcha(imageBuffer) {
  const processedBuffer = await preprocessCaptcha(imageBuffer);
  const worker = await createWorker("eng");
  try {
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      tessedit_pageseg_mode: "8" // PSM 8: Treat the image as a single word
    });
    const { data: { text } } = await worker.recognize(processedBuffer);
    const solved = text.replace(/[^a-zA-Z0-9]/g, "").trim().substring(0, 4);
    return solved;
  } finally {
    await worker.terminate();
  }
}

/**
 * Verify Doctor BMDC Number and Name
 * @param {string} bmdcNumber - Registration number
 * @param {string} doctorName - Doctor's input name
 * @param {number} practitionerType - 1 for MBBS, 2 for BDS
 * @param {number} attempt - Current retry attempt
 */
export async function verifyDoctorBMDC(bmdcNumber, doctorName, practitionerType = 1, attempt = 1) {
  console.log(`Starting BMDC verification for number ${bmdcNumber}, doctorName ${doctorName}, type ${practitionerType}, attempt ${attempt}`);
  
  const sanitizedNumber = bmdcNumber.replace(/\D/g, "");
  if (!sanitizedNumber) {
    return { success: false, reason: "BMDC registration number must contain digits." };
  }

  try {
    // 1. GET verify.bmdc.org.bd to initialize session and extract tokens
    const getRes = await axios.get(BMDC_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    const getHtml = getRes.data;
    const cookies = getRes.headers["set-cookie"];
    const cookieHeader = cookies ? cookies.map(c => c.split(";")[0]).join("; ") : "";

    const $ = cheerio.load(getHtml);

    // Extract CSRF token
    const csrfToken = $('input[name="bmdckyc_csrf_token"]').val();
    const actionKey = $('#action_key').val();
    const actionFlag = $('#action_flag').val();
    
    // Find first captcha image URL
    let captchaImgSrc = $('#captcha1 img').attr('src');
    if (!captchaImgSrc) {
      // Fallback
      captchaImgSrc = $('img[src*="cpt/"]').attr('src');
    }

    if (!csrfToken || !captchaImgSrc) {
      throw new Error("Unable to parse form fields or CAPTCHA from BMDC portal.");
    }

    // Resolve absolute image URL
    const captchaUrl = captchaImgSrc.startsWith("http") 
      ? captchaImgSrc 
      : new URL(captchaImgSrc, BMDC_URL).toString();

    console.log(`Extracted CAPTCHA URL: ${captchaUrl}`);

    // 2. Fetch CAPTCHA image using the same session cookies
    const imgRes = await axios.get(captchaUrl, {
      responseType: "arraybuffer",
      headers: {
        Cookie: cookieHeader,
        Referer: BMDC_URL,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    // 3. Solve CAPTCHA
    const solvedCaptcha = await solveCaptcha(Buffer.from(imgRes.data));
    console.log(`Solved CAPTCHA code: "${solvedCaptcha}"`);

    if (!solvedCaptcha || solvedCaptcha.length !== 4) {
      console.warn(`Captcha solved code length was not 4 (got "${solvedCaptcha}"). Retrying...`);
      if (attempt < 6) {
        return await verifyDoctorBMDC(bmdcNumber, doctorName, practitionerType, attempt + 1);
      }
      return { success: false, reason: "Verification system failed to solve CAPTCHA security check." };
    }

    // 4. POST search form
    const payload = {
      bmdckyc_csrf_token: csrfToken,
      reg_ful_no: sanitizedNumber,
      reg_student: String(practitionerType),
      captcha_code: solvedCaptcha,
      action_key: actionKey,
      action_flag: actionFlag,
      submit: ""
    };

    const postRes = await axios.post(BMDC_POST_URL, new URLSearchParams(payload).toString(), {
      headers: {
        Cookie: cookieHeader,
        Referer: BMDC_URL,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    const resultHtml = postRes.data;
    const $result = cheerio.load(resultHtml);

    // 5. Check response content for captcha/errors or success details
    const fullText = $result("body").text();

    // Check for wrong captcha error
    if (fullText.includes("Invalid Captcha") || fullText.includes("Wrong Captcha") || fullText.includes("Captcha Code Not Match")) {
      console.log("Wrong CAPTCHA solved. Retrying verification...");
      if (attempt < 6) {
        return await verifyDoctorBMDC(bmdcNumber, doctorName, practitionerType, attempt + 1);
      }
      return { success: false, reason: "Too many failed CAPTCHA verification attempts. Please try again." };
    }

    // Check for "Not Found" alerts
    if (fullText.includes("Not Found") || fullText.includes("No Registration Found") || fullText.includes("No Record Found")) {
      return { success: false, reason: "BMDC registration number not found in registry." };
    }

    // Parse the result details.
    // BMDC results usually render a card or table with information.
    // Let's print out text matches or search table rows for "Name" and "Status".
    let registeredName = "";
    let registeredStatus = "";

    // Search table cells or list items
    $result("td, th, p, div").each((i, el) => {
      const text = $(el).text();
      // Look for name field e.g. "Name : Dr. John Doe"
      if (/name/i.test(text) && text.includes(":")) {
        const parts = text.split(":");
        if (parts.length > 1 && !registeredName) {
          registeredName = cleanText(parts.slice(1).join(":"));
        }
      }
      // Look for status field e.g. "Status : Active"
      if (/status/i.test(text) && text.includes(":")) {
        const parts = text.split(":");
        if (parts.length > 1 && !registeredStatus) {
          registeredStatus = cleanText(parts.slice(1).join(":"));
        }
      }
    });

    // If we couldn't parse Name/Status using simple key-value split, try parsing by tables
    if (!registeredName) {
      $result("table tr").each((i, tr) => {
        const cells = $(tr).find("td, th");
        if (cells.length >= 2) {
          const key = cleanText($(cells[0]).text()).toLowerCase();
          const val = cleanText($(cells[1]).text());
          if (key.includes("name")) {
            registeredName = val;
          } else if (key.includes("status")) {
            registeredStatus = val;
          }
        }
      });
    }

    // Fallback: search for any cell containing prefix "DR." as name
    if (!registeredName) {
      $result("td, p").each((i, el) => {
        const text = cleanText($(el).text());
        if (/^dr\./i.test(text) && text.length > 5 && text.length < 50) {
          registeredName = text;
        }
      });
    }

    console.log(`Parsed registeredName: "${registeredName}", registeredStatus: "${registeredStatus}"`);

    // If no name found at all, check if there is table output in result
    if (!registeredName) {
      // If we got a result page but couldn't parse it, return fallback status
      console.warn("Could not parse doctor name from response HTML. Raw text preview:", fullText.substring(0, 500));
      // Return a structural failure so it falls back to manual review
      throw new Error("Result elements could not be parsed from BMDC response.");
    }

    // 6. Validate registered name matches doctor registration name (fuzzy matching)
    const normalizedInputName = doctorName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalizedRegisteredName = registeredName.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^dr/i, ""); // Strip "Dr" prefix

    // Fuzzy check: Check if registered name contains input name, or vice versa
    const isNameMatch = normalizedRegisteredName.includes(normalizedInputName) || 
                        normalizedInputName.includes(normalizedRegisteredName);

    if (!isNameMatch) {
      return {
        success: false,
        reason: `Name mismatch. Registration name: "${doctorName}", BM&DC registered name: "${registeredName}"`
      };
    }

    // Status check
    const isActive = /active|registered|valid/i.test(registeredStatus) || registeredStatus === ""; // If no status field found, assume OK
    if (!isActive && registeredStatus) {
      return {
        success: false,
        reason: `BM&DC practitioner status is inactive: "${registeredStatus}"`
      };
    }

    return {
      success: true,
      registeredName,
      status: registeredStatus || "Active"
    };

  } catch (err) {
    console.error("BMDC scraper error:", err.message);
    throw err; // Bubbles up to caller (which handles manual fallback)
  }
}
