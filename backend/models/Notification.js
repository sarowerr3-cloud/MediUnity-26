import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true, index: true }, // Firebase UID or Mongoose ID
  recipientRole: { type: String, enum: ["patient", "doctor", "provider"], required: true },
  type: { type: String, enum: ["BOOKING_CREATED", "STATUS_UPDATED", "GENERAL"], required: true },
  message: { type: String, required: true },
  relatedBookingId: { type: String, default: null },
  actionUrl: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export default Notification;
