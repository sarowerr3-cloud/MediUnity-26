import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
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
  },
  { timestamps: true }
);

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
