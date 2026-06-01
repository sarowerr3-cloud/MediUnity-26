import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    milestone: { type: String, default: "" }, // e.g. "Day 3 Post-Op"
    cheers: [{ type: String, default: [] }], // array of userIds (patient or doctor)
  },
  { timestamps: true }
);

const journalSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true, index: true }, // Clerk UserId
    patientName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true }, // e.g., "ACL Reconstruction"
    isPrivate: { type: Boolean, default: false },
    entries: [journalEntrySchema],
  },
  { timestamps: true }
);

const Journal = mongoose.models.Journal || mongoose.model("Journal", journalSchema);

export default Journal;
