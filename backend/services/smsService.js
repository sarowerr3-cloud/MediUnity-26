import axios from "axios";
import { sendSms } from "../utils/sms.js";
import { smsQueue } from "../queues/index.js";

/**
 * Service to dispatch SMS messages immediately.
 * Prefers SSLWireless (Bangladesh standard) if SMS_PROVIDER=sslwireless, 
 * falling back to Twilio (Global standard) or simulated console logging.
 * 
 * @param {string} phone - Target phone number
 * @param {string} message - Text body
 */
export async function sendSMSImmediate(phone, message) {
  const provider = process.env.SMS_PROVIDER || "twilio";

  if (provider === "sslwireless") {
    const apiToken = process.env.SSL_WIRELESS_API_TOKEN;
    const sid = process.env.SSL_WIRELESS_SID;
    const url = process.env.SSL_WIRELESS_URL || "https://sms.sslwireless.com/api/v3/send-sms";

    if (!apiToken || !sid) {
      console.warn("[SMS SERVICE] SSLWireless credentials not configured. Falling back to Twilio.");
      return await sendSms({ to: phone, body: message });
    }

    try {
      const response = await axios.post(url, {
        api_token: apiToken,
        sid: sid,
        msisdn: phone,
        sms: message,
        csms_id: `CSMS_${Date.now()}`
      });
      console.log("[SMS SERVICE] SSLWireless response:", response.data);
      return { success: true, provider: "sslwireless", data: response.data };
    } catch (err) {
      console.error("[SMS SERVICE] SSLWireless API call failed. Reverting to Twilio fallback:", err.message);
      return await sendSms({ to: phone, body: message });
    }
  }

  // Default standard Twilio dispatch / simulated console fallback
  return await sendSms({ to: phone, body: message });
}

/**
 * Queue SMS message for background BullMQ worker processing
 */
export async function queueSMS(phone, message) {
  try {
    await smsQueue.add("send-sms", { phone, message });
    return { success: true, queued: true };
  } catch (err) {
    console.error("[SMS SERVICE] Failed to queue SMS. Dispatched immediately instead:", err.message);
    return await sendSMSImmediate(phone, message);
  }
}
