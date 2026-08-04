import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", index: true },
    participants: [{ type: String, required: true }], // Firebase / Doctor IDs
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Add requested indexing rules
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ lastMessageAt: -1 });

const ChatRoom = mongoose.models.ChatRoom || mongoose.model("ChatRoom", chatRoomSchema);
export default ChatRoom;
