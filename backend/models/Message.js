import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    roomId: {
      type: String,
      default: null,
      index: true,
    },
    senderId: {
      type: String, // Clerk patient ID or doctor ObjectId string
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for pagination and room sorting
messageSchema.index({ roomId: 1 });
messageSchema.index({ roomId: 1, createdAt: -1 });

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
