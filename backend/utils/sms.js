/**
 * SMS Utility — Twilio with console simulation fallback
 * Mirrors the existing email.js pattern.
 *
 * To enable real SMS, set in backend/.env:
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
 *
 * Without those keys, OTPs are printed to the server console.
 */

export async function sendSms({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    // Console simulation — works out-of-box in development
    console.log(`\n==============================================`);
    console.log(`[SIMULATED SMS] (Twilio credentials not set)`);
    console.log(`To: ${to}`);
    console.log(`Message: ${body}`);
    console.log(`==============================================\n`);
    return { success: true, simulated: true };
  }

  try {
    // Dynamically import twilio only when credentials are available
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    const message = await client.messages.create({ body, from, to });
    console.log(`SMS sent to ${to}: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}
