import Notification from "../models/Notification.js";
import { sendSSE } from "./sse.js";

/**
 * Helper to write a notification to the database and send it via SSE in real-time
 */
export async function createAndSendNotification({ recipientId, recipientRole, type, message, relatedBookingId = null, actionUrl = null }) {
  try {
    const notif = await Notification.create({
      recipientId,
      recipientRole,
      type,
      message,
      relatedBookingId,
      actionUrl,
      isRead: false
    });
    
    // Broadcast via SSE
    sendSSE(recipientId, "notification", notif);
    
    return notif;
  } catch (err) {
    console.error("Failed to create/send notification:", err.message);
  }
}
